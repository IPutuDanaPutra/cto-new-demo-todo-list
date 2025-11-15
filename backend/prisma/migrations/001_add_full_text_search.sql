-- Create migration to add full-text search capabilities
-- Add tsvector column for todos table

-- Add search vector column for full-text search
ALTER TABLE "todos" ADD COLUMN "search_vector" tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_todo_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER todo_search_vector_update
  BEFORE INSERT OR UPDATE ON "todos"
  FOR EACH ROW EXECUTE FUNCTION update_todo_search_vector();

-- Create index for full-text search
CREATE INDEX "todos_search_vector_idx" ON "todos" USING GIN ("search_vector");

-- Update existing todos with search vectors
UPDATE "todos" SET "search_vector" = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B');

-- Add search vector for tags as well
ALTER TABLE "tags" ADD COLUMN "search_vector" tsvector;

CREATE OR REPLACE FUNCTION update_tag_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tag_search_vector_update
  BEFORE INSERT OR UPDATE ON "tags"
  FOR EACH ROW EXECUTE FUNCTION update_tag_search_vector();

CREATE INDEX "tags_search_vector_idx" ON "tags" USING GIN ("search_vector");

UPDATE "tags" SET "search_vector" = setweight(to_tsvector('english', COALESCE(name, '')), 'A');

-- Add search vector for categories
ALTER TABLE "categories" ADD COLUMN "search_vector" tsvector;

CREATE OR REPLACE FUNCTION update_category_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_search_vector_update
  BEFORE INSERT OR UPDATE ON "categories"
  FOR EACH ROW EXECUTE FUNCTION update_category_search_vector();

CREATE INDEX "categories_search_vector_idx" ON "categories" USING GIN ("search_vector");

UPDATE "categories" SET "search_vector" = setweight(to_tsvector('english', COALESCE(name, '')), 'A');