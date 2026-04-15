<?php

declare(strict_types=1);

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\BeforeValidException;
use UnexpectedValueException;

/**
 * JwtMiddleware — validates the JWT issued by the Spring Boot (pawster) backend.
 *
 * Basic usage:
 *   $payload = JwtMiddleware::authenticate();
 *
 * Reading claims in controllers:
 *   $payload->sub;    // username
 *   $payload->roles;  // string[]
 */
class JwtMiddleware
{
    private const ALGORITHM = 'HS256';

    /**
     * Validate the JWT from Bearer header or HttpOnly cookie.
     * Returns the decoded payload on success, sends JSON error and exits on failure.
     */
    public static function authenticate(): object
    {
        // Allow CORS preflight to pass through
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $token = self::extractToken();

        if ($token === null) {
            self::abort(401, 'No authentication token found. Please log in.');
        }

        $secret = getenv('JWT_SECRET');
        if (!$secret) {
            self::abort(500, 'JWT_SECRET is not configured on the server.');
        }

        $keyBytes = base64_decode($secret, strict: true);
        if ($keyBytes === false) {
            self::abort(500, 'JWT_SECRET is not valid base64.');
        }

        return self::decode($token, $keyBytes);
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    /**
     * Extract the raw JWT string from:
     *   1. Authorization: Bearer <token>  (React / SPA clients)
     *   2. HttpOnly 'jwt' cookie          (cookie-based flow)
     */
    private static function extractToken(): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            return $token !== '' ? $token : null;
        }

        return $_COOKIE['jwt'] ?? null;
    }

    /**
     * Decode and verify the JWT against the shared secret.
     * Only HS256 is accepted — prevents "alg: none" attacks.
     */
    private static function decode(string $token, string $keyBytes): object
    {
        try {
            return JWT::decode($token, new Key($keyBytes, self::ALGORITHM));
        } catch (ExpiredException) {
            self::abort(401, 'Token has expired. Please log in again.');
        } catch (BeforeValidException) {
            self::abort(401, 'Token is not yet valid.');
        } catch (SignatureInvalidException) {
            self::abort(401, 'Token signature is invalid.');
        } catch (UnexpectedValueException $e) {
            self::abort(401, 'Malformed token: ' . $e->getMessage());
        } catch (\Exception $e) {
            self::abort(401, 'Token validation failed: ' . $e->getMessage());
        }
    }

    private static function abort(int $code, string $message): never
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message]);
        exit();
    }
}