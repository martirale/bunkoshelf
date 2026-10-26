BEGIN;
DELETE FROM library_series;
DELETE FROM book_series;

INSERT INTO library_series (id, slug, title, sort_title, path, library_section)
SELECT section || '-' || n, section || '-' || n, 'Series ' || n, 'series ' || n, '/' || section || '/' || n, section
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section) CROSS JOIN generate_series(1, 14) n;

INSERT INTO library_series (id, slug, title, sort_title, path, library_section, is_logical)
SELECT section || suffix, section || suffix, suffix, suffix, 'logical:' || section || suffix, section, TRUE
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section)
CROSS JOIN (VALUES ('-logical-1'), ('-logical-2'), ('-empty-logical')) parents(suffix);

INSERT INTO library_series (id, slug, title, sort_title, path, library_section, is_oneshot)
SELECT section || '-oneshot', section || '-oneshot', 'Oneshot', 'oneshot', '/' || section || '/oneshot', section, TRUE
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section);

INSERT INTO library_volumes (id, slug, title, sort_title, filename, full_path, series_id)
SELECT id || '-volume', id || '-volume', title, sort_title, '1.cbz', path || '/1.cbz', id FROM library_series WHERE NOT is_logical;

INSERT INTO logical_series_members (logical_series_id, series_id, position)
SELECT section || CASE WHEN n < 12 THEN '-logical-1' ELSE '-logical-2' END, section || '-' || n, CASE WHEN n < 12 THEN n - 7 ELSE n - 11 END
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section) CROSS JOIN generate_series(8, 14) n;

INSERT INTO book_series (id, slug, title, sort_title, path)
SELECT 'book-' || n, 'book-' || n, 'Book series ' || n, 'book series ' || n, '/books/' || n FROM generate_series(1, 14) n;
INSERT INTO book_series (id, slug, title, sort_title, path, is_logical)
SELECT id, id, id, id, 'logical:' || id, TRUE FROM (VALUES ('book-logical-1'), ('book-logical-2'), ('book-empty-logical')) parents(id);
INSERT INTO book_series (id, slug, title, sort_title, path, is_oneshot)
VALUES ('book-oneshot', 'book-oneshot', 'Oneshot', 'oneshot', '/books/oneshot', TRUE);
INSERT INTO book_volumes (id, series_id, slug, title, sort_title, filename, full_path)
SELECT id || '-volume', id, id || '-volume', title, sort_title, '1.epub', path || '/1.epub' FROM book_series WHERE NOT is_logical;
INSERT INTO logical_book_series_members (logical_series_id, series_id, position)
SELECT CASE WHEN n < 12 THEN 'book-logical-1' ELSE 'book-logical-2' END, 'book-' || n, CASE WHEN n < 12 THEN n - 7 ELSE n - 11 END
FROM generate_series(8, 14) n;

CREATE TEMP VIEW count_manga AS {{manga}};
CREATE TEMP VIEW count_comic AS {{comic}};
CREATE TEMP VIEW count_others AS {{others}};
CREATE TEMP VIEW count_all AS {{all}};
CREATE TEMP VIEW count_general_books AS {{generalBooks}};
CREATE TEMP VIEW count_books AS {{books}};

DO $$
BEGIN
  ASSERT (SELECT count::int FROM count_manga) = 9, 'Manga must count seven physical series and two logical series';
  ASSERT (SELECT count::int FROM count_comic) = 9, 'Comics must count nine series instead of fourteen';
  ASSERT (SELECT count::int FROM count_others) = 9, 'Others must count nine collections';
  ASSERT (SELECT count::int FROM count_books) = 9, 'Books must count nine series and exclude empty groupings';
  ASSERT (SELECT count::int FROM count_all) = 27, 'General archive counts must respect every library';
  ASSERT (SELECT count::int FROM count_general_books) = 9, 'General book counts must respect logical series';
  ASSERT (SELECT COUNT(*) FROM library_volumes) = 45, 'Volume totals must retain every physical volume and oneshot';
  ASSERT (SELECT COUNT(*) FROM book_volumes) = 15, 'Book totals must retain every physical book and oneshot';
END $$;

DELETE FROM library_series WHERE is_logical;
DELETE FROM book_series WHERE is_logical;

DO $$
BEGIN
  ASSERT (SELECT count::int FROM count_comic) = 14, 'Removing groupings must restore the physical series count';
  ASSERT (SELECT count::int FROM count_books) = 14, 'Removing book groupings must restore the physical series count';
END $$;
ROLLBACK;
