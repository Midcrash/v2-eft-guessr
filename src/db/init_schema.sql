-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Locations table for storing image locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_name TEXT NOT NULL,
  x_coord FLOAT NOT NULL,
  y_coord FLOAT,
  z_coord FLOAT NOT NULL,
  image_path TEXT NOT NULL,
  original_filename TEXT,
  difficulty TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on map_name for faster queries
CREATE INDEX IF NOT EXISTS locations_map_name_idx ON locations(map_name);

-- Games table for tracking game sessions
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID DEFAULT NULL, -- Can link to auth.users later
  map_name TEXT NOT NULL,
  round_count INTEGER NOT NULL DEFAULT 5,
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Rounds table for tracking individual guesses
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  round_number INTEGER NOT NULL,
  guess_x FLOAT,
  guess_z FLOAT,
  actual_x FLOAT,
  actual_z FLOAT,
  score INTEGER,
  distance FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries on game_id
CREATE INDEX IF NOT EXISTS rounds_game_id_idx ON rounds(game_id);

-- Map configurations table for storing map bounds and dimensions
CREATE TABLE IF NOT EXISTS map_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_name TEXT NOT NULL UNIQUE,
  world_bounds JSONB NOT NULL,
  image_width INTEGER NOT NULL,
  image_height INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to init schema (callable from client)
CREATE OR REPLACE FUNCTION init_tarkov_guessr_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Create tables (if they don't exist)
  -- Locations table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locations') THEN
    CREATE TABLE locations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      map_name TEXT NOT NULL,
      x_coord FLOAT NOT NULL,
      y_coord FLOAT,
      z_coord FLOAT NOT NULL,
      image_path TEXT NOT NULL,
      original_filename TEXT,
      difficulty TEXT DEFAULT 'normal',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX locations_map_name_idx ON locations(map_name);
  END IF;

  -- Games table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games') THEN
    CREATE TABLE games (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID DEFAULT NULL,
      map_name TEXT NOT NULL,
      round_count INTEGER NOT NULL DEFAULT 5,
      total_score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    );
  END IF;

  -- Rounds table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rounds') THEN
    CREATE TABLE rounds (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      game_id UUID REFERENCES games(id) ON DELETE CASCADE,
      location_id UUID REFERENCES locations(id),
      round_number INTEGER NOT NULL,
      guess_x FLOAT,
      guess_z FLOAT,
      actual_x FLOAT,
      actual_z FLOAT,
      score INTEGER,
      distance FLOAT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX rounds_game_id_idx ON rounds(game_id);
  END IF;

  -- Map configurations table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'map_configs') THEN
    CREATE TABLE map_configs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      map_name TEXT NOT NULL UNIQUE,
      world_bounds JSONB NOT NULL,
      image_width INTEGER NOT NULL,
      image_height INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END;
$$; 