INSERT INTO library_series (id, slug, title, sort_title, path, library_section)
SELECT section, section, section, section, '/' || section, section
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section);

INSERT INTO volume_metadata (id, file_path, title, alt_title, alt_series, writer, publisher, year, age_rating, language_iso)
SELECT section || '-' || n, section || '-' || n, 'Original', 'Alternate', 'Alternate series',
  CASE WHEN n = 1 THEN 'First, Second' ELSE NULL END,
  CASE WHEN n = 1 THEN ' Publisher, Inc. ' ELSE 'Other' END,
  2024, 'Teen', 'es'
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section) CROSS JOIN generate_series(1, 2) n;

INSERT INTO library_volumes (id, slug, title, sort_title, filename, full_path, series_id, metadata_id)
SELECT id, id, title, id, id || '.cbz', '/' || id || '.cbz', split_part(id, '-', 1), id FROM volume_metadata;

INSERT INTO book_series (id, slug, title, sort_title, path)
VALUES ('book', 'book', 'Book series', 'book', '/book');
INSERT INTO book_volumes (id, series_id, slug, title, sort_title, filename, full_path)
SELECT 'book-' || n, 'book', 'book-' || n, 'Book ' || n, 'book ' || n, n || '.epub', '/book/' || n || '.epub' FROM generate_series(1, 2) n;
INSERT INTO book_metadata (id, volume_id, title, publisher, published_at, language, age_rating, package_path)
SELECT id, id, title, CASE WHEN id = 'book-1' THEN 'Publisher, Inc.' ELSE 'Other' END, '2024-01-01', 'es', 'Teen', 'content.opf' FROM book_volumes;
INSERT INTO book_people (id, metadata_id, name, kind, role, position)
VALUES ('book-author', 'book-1', 'Second', 'creator', 'aut', 0);
