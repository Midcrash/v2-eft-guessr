import supabase from "../api/supabase";

/**
 * Simple test function to insert a record into locations table
 * This helps isolate any RLS or permission issues
 */
export const testInsert = async () => {
  console.log("Starting test insert");

  // Simple test data
  const testData = {
    map_name: "test",
    x_coord: 100,
    y_coord: 50,
    z_coord: 200,
    image_path: "https://example.com/test.jpg",
  };

  console.log("Test data:", testData);

  try {
    // Attempt direct insert
    const { data, error } = await supabase
      .from("locations")
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error("Test insert failed:", error);
      return { success: false, error };
    }

    console.log("Test insert succeeded:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Exception during test insert:", error);
    return { success: false, error };
  }
};

/**
 * Function to test if we have proper authentication
 */
export const checkAuth = async () => {
  try {
    // Check what auth we have
    const { data: authData } = await supabase.auth.getSession();
    console.log("Auth session:", authData);

    // Try to get any data from the locations table to test read permissions
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Auth check select failed:", error);
      return { success: false, error, authData };
    }

    console.log("Auth check select succeeded:", data);
    return { success: true, data, authData };
  } catch (error) {
    console.error("Exception during auth check:", error);
    return { success: false, error };
  }
};
