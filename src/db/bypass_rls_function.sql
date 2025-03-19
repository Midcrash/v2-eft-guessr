-- Function to insert location data while bypassing RLS policies
-- This function uses SECURITY DEFINER to run with the privileges of the function creator
CREATE OR REPLACE FUNCTION insert_location_bypass_rls(
  p_map_name TEXT,
  p_x_coord FLOAT,
  p_y_coord FLOAT,
  p_z_coord FLOAT,
  p_image_path TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Insert the record directly, bypassing RLS
  INSERT INTO locations (
    map_name,
    x_coord,
    y_coord,
    z_coord,
    image_path
  ) VALUES (
    p_map_name,
    p_x_coord,
    p_y_coord,
    p_z_coord,
    p_image_path
  )
  RETURNING * INTO v_result;
  
  -- Return the result as JSON
  RETURN row_to_json(v_result);
END;
$$;

-- Grant permission to execute this function to anonymous users
GRANT EXECUTE ON FUNCTION insert_location_bypass_rls TO anon;

-- Alternative version that accepts a JSON object 
-- (more compatible with the Supabase JS client)
CREATE OR REPLACE FUNCTION insert_location_bypass_rls(
  data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Insert the record directly, bypassing RLS
  INSERT INTO locations (
    map_name,
    x_coord,
    y_coord,
    z_coord,
    image_path
  ) VALUES (
    data->>'map_name',
    (data->>'x_coord')::FLOAT,
    (data->>'y_coord')::FLOAT,
    (data->>'z_coord')::FLOAT,
    data->>'image_path'
  )
  RETURNING * INTO v_result;
  
  -- Return the result as JSON
  RETURN row_to_json(v_result);
END;
$$;

-- Grant permission to execute this function to anonymous users
GRANT EXECUTE ON FUNCTION insert_location_bypass_rls(JSONB) TO anon; 