package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.Survey;
import com.pawstar.pawster.service.SurveyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    @Autowired
    private SurveyService surveyService;

    // POST /api/surveys  — authenticated user submits post-adoption survey
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Survey survey) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(surveyService.create(survey));
        } catch (RuntimeException e) {
            return bad(e.getMessage());
        }
    }

    // GET /api/surveys  — ADMIN: all surveys
    @GetMapping
    public List<Survey> getAll() {
        return surveyService.getAll();
    }

    // GET /api/surveys/my-surveys?userId=3
    @GetMapping("/my-surveys")
    public List<Survey> mySurveys(@RequestParam Integer userId) {
        return surveyService.getByUser(userId);
    }

    // GET /api/surveys/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(surveyService.getById(id));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", msg));
    }

    private ResponseEntity<?> notFound(String msg) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", msg));
    }
}