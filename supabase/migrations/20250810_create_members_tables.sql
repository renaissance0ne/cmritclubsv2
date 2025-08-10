-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(10) NOT NULL CHECK (department IN ('cse', 'csm', 'hs', 'ece', 'csd')),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  college VARCHAR(10) NOT NULL CHECK (college IN ('cmrit', 'cmrcet', 'cmrtc', 'cmrec')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clubs table if not exists
CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  college VARCHAR(10) NOT NULL CHECK (college IN ('cmrit', 'cmrcet', 'cmrtc', 'cmrec')),
  leader_id VARCHAR(255) NOT NULL, -- Clerk user ID
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create club_incharge table
CREATE TABLE IF NOT EXISTS club_incharge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, faculty_id, is_active) -- Ensure only one active in-charge per club
);

-- Create club_members table
CREATE TABLE IF NOT EXISTS club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL CHECK (year IN (1, 2, 3, 4)),
  department VARCHAR(10) NOT NULL CHECK (department IN ('cse', 'csm', 'hs', 'ece', 'csd')),
  section VARCHAR(10),
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, roll_number, is_active) -- Ensure unique roll numbers per club
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faculty_college ON faculty(college);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);
CREATE INDEX IF NOT EXISTS idx_clubs_college ON clubs(college);
CREATE INDEX IF NOT EXISTS idx_clubs_leader ON clubs(leader_id);
CREATE INDEX IF NOT EXISTS idx_club_incharge_club ON club_incharge(club_id);
CREATE INDEX IF NOT EXISTS idx_club_incharge_active ON club_incharge(club_id, is_active);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_active ON club_members(club_id, is_active);
CREATE INDEX IF NOT EXISTS idx_club_members_roll ON club_members(club_id, roll_number);

-- Create function to assign club in-charge (handles deactivating previous in-charge)
CREATE OR REPLACE FUNCTION assign_club_incharge(
  p_club_id UUID,
  p_faculty_id UUID,
  p_current_incharge_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Deactivate current in-charge if exists
  IF p_current_incharge_id IS NOT NULL THEN
    UPDATE club_incharge 
    SET is_active = false, updated_at = NOW()
    WHERE id = p_current_incharge_id AND club_id = p_club_id;
  ELSE
    -- Deactivate any existing active in-charge for this club
    UPDATE club_incharge 
    SET is_active = false, updated_at = NOW()
    WHERE club_id = p_club_id AND is_active = true;
  END IF;

  -- Insert new in-charge or reactivate existing one
  INSERT INTO club_incharge (club_id, faculty_id, is_active, assigned_at)
  VALUES (p_club_id, p_faculty_id, true, NOW())
  ON CONFLICT (club_id, faculty_id, is_active) 
  DO UPDATE SET 
    assigned_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert sample faculty data for testing (CMRIT only)
INSERT INTO faculty (name, department, email, phone, college) VALUES
('Dr. Rajesh Kumar', 'cse', 'rajesh.kumar@cmrit.ac.in', '+91 9876543210', 'cmrit'),
('Dr. Priya Sharma', 'csm', 'priya.sharma@cmrit.ac.in', '+91 9876543211', 'cmrit'),
('Dr. Anil Reddy', 'ece', 'anil.reddy@cmrit.ac.in', '+91 9876543212', 'cmrit'),
('Dr. Sunita Rao', 'hs', 'sunita.rao@cmrit.ac.in', '+91 9876543213', 'cmrit'),
('Dr. Vikram Singh', 'csd', 'vikram.singh@cmrit.ac.in', '+91 9876543214', 'cmrit'),
('Prof. Meera Patel', 'cse', 'meera.patel@cmrit.ac.in', '+91 9876543215', 'cmrit'),
('Prof. Arjun Nair', 'csm', 'arjun.nair@cmrit.ac.in', '+91 9876543216', 'cmrit'),
('Dr. Kavitha Menon', 'ece', 'kavitha.menon@cmrit.ac.in', '+91 9876543217', 'cmrit')
ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_club_incharge_updated_at BEFORE UPDATE ON club_incharge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_club_members_updated_at BEFORE UPDATE ON club_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
