INSERT INTO users (id, username, password) VALUES ('reader', 'reader', 'unused');

INSERT INTO library_series (id, slug, title, sort_title, path, library_section, is_logical)
SELECT section || suffix, section || suffix, title, bunko_natural_sort_key(title), '/' || section || suffix, section, suffix = '-logical'
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section)
CROSS JOIN (VALUES ('-a', 'Z Turf Wars'), ('-b', 'A Ruins'), ('-logical', 'The Legend of Korra')) series(suffix, title);

INSERT INTO library_volumes (id, slug, title, sort_title, filename, full_path, series_id)
SELECT s.id || '-' || n, s.id || '-' || n, 'Volume ' || n, bunko_natural_sort_key('Volume ' || n), n || '.cbz', s.path || '/' || n || '.cbz', s.id
FROM library_series s CROSS JOIN generate_series(1, 3) n WHERE NOT s.is_logical;

INSERT INTO logical_series_members (logical_series_id, series_id, position)
SELECT library_section || '-logical', id, CASE WHEN id LIKE '%-a' THEN 1 ELSE 2 END
FROM library_series WHERE NOT is_logical;

INSERT INTO user_to_volumes (id, user_id, volume_id, is_read)
SELECT id, 'reader', id, TRUE FROM library_volumes WHERE id LIKE '%-a-%';

DO $$
DECLARE section TEXT; actual TEXT[]; total INTEGER; parent_id TEXT;
BEGIN
  FOREACH section IN ARRAY ARRAY['manga', 'comic', 'other'] LOOP
    SELECT s.id INTO parent_id FROM logical_series_members m
    JOIN library_series s ON s.id = m.logical_series_id WHERE m.series_id = section || '-a';
    ASSERT parent_id = section || '-logical', 'Volume navigation must resolve its logical parent';

    SELECT array_agg(id ORDER BY position, sort_title, id) INTO actual
    FROM library_series_volumes sv JOIN library_volumes v ON v.id = sv.volume_id
    WHERE sv.series_id = section || '-logical';
    ASSERT actual = ARRAY[section || '-a-1', section || '-a-2', section || '-a-3', section || '-b-1', section || '-b-2', section || '-b-3'], 'Member order must precede volume order';

    SELECT COUNT(DISTINCT s.id) INTO total FROM library_series s
    JOIN library_series_volumes sv ON sv.series_id = s.id
    WHERE s.library_section = section
      AND NOT EXISTS (SELECT 1 FROM logical_series_members m WHERE m.series_id = s.id);
    ASSERT total = 1, 'Libraries must show one logical series';

    SELECT COUNT(*) INTO total FROM user_to_volumes u
    JOIN library_series_volumes sv ON sv.volume_id = u.volume_id
    WHERE u.user_id = 'reader' AND u.is_read AND sv.series_id = section || '-logical';
    ASSERT total = 3, 'Logical progress must reuse physical volume progress';

    SELECT array_agg(id) INTO actual FROM (
      SELECT v.id FROM library_series_volumes sv JOIN library_volumes v ON v.id = sv.volume_id
      WHERE sv.series_id = section || '-logical' ORDER BY sv.position, v.sort_title, v.id LIMIT 3 OFFSET 3
    ) page;
    ASSERT actual = ARRAY[section || '-b-1', section || '-b-2', section || '-b-3'], 'Pagination must preserve member order';
  END LOOP;
  BEGIN
    INSERT INTO logical_series_members VALUES ('comic-logical', 'comic-a', 3);
    RAISE EXCEPTION 'Duplicate membership was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

INSERT INTO book_series (id, slug, title, sort_title, path, is_logical)
VALUES ('book-a', 'book-a', 'Z First', 'z first', '/books/a', FALSE),
  ('book-b', 'book-b', 'A Second', 'a second', '/books/b', FALSE),
  ('book-logical', 'book-logical', 'Logical books', 'logical books', 'logical:books', TRUE);

INSERT INTO book_volumes (id, series_id, slug, title, sort_title, filename, full_path, number)
SELECT s.id || '-' || n, s.id, s.id || '-' || n, 'Book ' || n, 'book ' || n, n || '.epub', s.path || '/' || n || '.epub', n
FROM book_series s CROSS JOIN generate_series(1, 3) n WHERE NOT s.is_logical;

INSERT INTO logical_book_series_members VALUES ('book-logical', 'book-b', 2), ('book-logical', 'book-a', 1);

DELETE FROM book_series WHERE is_logical = FALSE AND NOT EXISTS (SELECT 1 FROM book_volumes WHERE book_volumes.series_id = book_series.id);

DO $$
DECLARE actual TEXT[]; total INTEGER; parent_id TEXT;
BEGIN
  SELECT s.id INTO parent_id FROM logical_book_series_members m
  JOIN book_series s ON s.id = m.logical_series_id WHERE m.series_id = 'book-a';
  ASSERT parent_id = 'book-logical', 'Books must navigate within their logical parent';
  SELECT s.id INTO parent_id FROM library_volumes v
  JOIN logical_series_members m ON m.series_id = v.series_id
  JOIN library_series s ON s.id = m.logical_series_id
  WHERE v.slug = 'other-a-1' AND s.library_section = 'other';
  ASSERT parent_id = 'other-logical', 'Mirrored EPUB navigation must use the library grouping';

  ASSERT EXISTS (SELECT 1 FROM book_series WHERE id = 'book-logical'), 'Scanning must preserve logical series';
  SELECT array_agg(v.id ORDER BY sv.position, v.number, v.sort_title, v.id) INTO actual
  FROM book_series_volumes sv JOIN book_volumes v ON v.id = sv.volume_id WHERE sv.series_id = 'book-logical';
  ASSERT actual = ARRAY['book-a-1', 'book-a-2', 'book-a-3', 'book-b-1', 'book-b-2', 'book-b-3'], 'Books must preserve member and volume order';
  SELECT COUNT(DISTINCT s.id) INTO total FROM book_series s JOIN book_series_volumes sv ON sv.series_id = s.id
  WHERE NOT EXISTS (SELECT 1 FROM logical_book_series_members m WHERE m.series_id = s.id);
  ASSERT total = 1, 'Books must show one logical series';
END $$;

DELETE FROM library_series WHERE is_logical;
DELETE FROM book_series WHERE is_logical;

DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM library_volumes) = 18, 'Removing grouping must preserve physical volumes';
  ASSERT (SELECT COUNT(*) FROM library_series) = 6, 'Removing grouping must restore physical series';
  ASSERT (SELECT COUNT(*) FROM user_to_volumes WHERE is_read) = 9, 'Removing grouping must preserve progress';
  ASSERT (SELECT COUNT(*) FROM book_volumes) = 6, 'Removing book grouping must preserve physical books';
  ASSERT (SELECT COUNT(*) FROM book_series) = 2, 'Removing book grouping must preserve physical series';
  ASSERT NOT EXISTS (SELECT 1 FROM logical_series_members), 'Memberships must cascade';
  ASSERT NOT EXISTS (SELECT 1 FROM logical_book_series_members), 'Book memberships must cascade';
END $$;
