-- Create a function to bypass RLS for inserting locations
-- This function runs with security definer, meaning it inherits the permissions of the creator (superuser)

CREATE OR REPLACE FUNCTION public.insert_location_bypass_rls(
  p_map_name TEXT,
  p_x_coord DOUBLE PRECISION,
  p_y_coord DOUBLE PRECISION,
  p_z_coord DOUBLE PRECISION,
  p_image_path TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This is what allows us to bypass RLS
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert the record
  INSERT INTO public.locations (map_name, x_coord, y_coord, z_coord, image_path)
  VALUES (p_map_name, p_x_coord, p_y_coord, p_z_coord, p_image_path)
  RETURNING to_jsonb(locations.*) INTO result;
  
  RETURN result;
END;
$$;

-- Create a version of the function that accepts a JSONB object
-- This is more compatible with the Supabase JS client
CREATE OR REPLACE FUNCTION public.insert_location_bypass_rls(
  p_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This is what allows us to bypass RLS
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert the record
  INSERT INTO public.locations (
    map_name,
    x_coord,
    y_coord,
    z_coord,
    image_path
  )
  VALUES (
    p_data->>'map_name',
    (p_data->>'x_coord')::DOUBLE PRECISION,
    (p_data->>'y_coord')::DOUBLE PRECISION,
    (p_data->>'z_coord')::DOUBLE PRECISION,
    p_data->>'image_path'
  )
  RETURNING to_jsonb(locations.*) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to the anonymous user
GRANT EXECUTE ON FUNCTION public.insert_location_bypass_rls(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_location_bypass_rls(JSONB) TO anon; 