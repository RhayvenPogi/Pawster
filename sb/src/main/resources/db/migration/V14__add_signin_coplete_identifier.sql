ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Fix existing normal users (those who have phone filled in)
UPDATE users SET profile_complete = TRUE 
WHERE phone IS NOT NULL AND phone != '' 
  AND address IS NOT NULL AND address != ''
  AND city IS NOT NULL AND city != '';