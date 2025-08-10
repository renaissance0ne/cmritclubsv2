-- Replace status field with approval_status field in letters table
-- This will store per-official approval status with overall_status tracking

-- Add the new approval_status column
ALTER TABLE letters 
ADD COLUMN approval_status JSONB DEFAULT '{"overall_status": "pending"}';

-- Initialize approval_status for existing letters based on recipients
UPDATE letters 
SET approval_status = '{"overall_status": "pending"}'
WHERE approval_status IS NULL;

-- Remove the old status column
ALTER TABLE letters 
DROP COLUMN IF EXISTS status;

-- Add comment for documentation
COMMENT ON COLUMN letters.approval_status IS 'Stores approval status per official with structure: {"official_role": {"status": "pending|approved|rejected", "comments": null, "updated_at": "...", "official_id": "..."}, "overall_status": "pending|approved|rejected"}';
