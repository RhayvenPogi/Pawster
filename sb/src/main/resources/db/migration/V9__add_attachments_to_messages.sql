ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS attachment_url  TEXT         DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20)  DEFAULT NULL;
-- attachment_type values: 'image' | 'video' | 'file'
-- attachment_url: relative path stored as /uploads/messages/{filename}
 
COMMENT ON COLUMN messages.attachment_url  IS 'Relative URL of uploaded attachment, e.g. /uploads/messages/uuid_filename.jpg';
COMMENT ON COLUMN messages.attachment_type IS 'One of: image, video, file';