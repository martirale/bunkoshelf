INSERT INTO library_series (id, slug, title, sort_title, path, library_section)
SELECT section || '-c', section || '-c', 'Extra series', 'extra series', '/' || section || '-c', section
FROM (VALUES ('manga'), ('comic'), ('other')) sections(section);

INSERT INTO library_volumes (id, slug, title, sort_title, filename, full_path, series_id)
SELECT id || '-1', id || '-1', 'Extra volume', 'extra volume', '1.cbz', path || '/1.cbz', id
FROM library_series WHERE id IN ('manga-c', 'comic-c', 'other-c');

INSERT INTO user_to_series (id, user_id, series_id, is_favorite)
SELECT id, 'reader', id, TRUE FROM library_series WHERE is_logical;
UPDATE library_series SET status = 'ONGOING' WHERE is_logical;

DO $$
DECLARE section TEXT; actual TEXT[];
BEGIN
  FOREACH section IN ARRAY ARRAY['manga', 'comic', 'other'] LOOP
    DELETE FROM logical_series_members WHERE logical_series_id = section || '-logical';
    INSERT INTO logical_series_members VALUES (section || '-logical', section || '-b', 1), (section || '-logical', section || '-c', 2);
    UPDATE library_series SET title = 'Updated title', sort_title = 'updated title', updated_at = NOW() WHERE id = section || '-logical';

    ASSERT EXISTS (SELECT 1 FROM library_series WHERE id = section || '-logical' AND slug = section || '-logical' AND title = 'Updated title' AND status = 'ONGOING'), 'Editing must preserve the parent identity, slug and status';
    ASSERT EXISTS (SELECT 1 FROM user_to_series WHERE series_id = section || '-logical' AND is_favorite), 'Editing must preserve favorites';
    ASSERT NOT EXISTS (SELECT 1 FROM logical_series_members WHERE series_id = section || '-a'), 'Removed series must become available';
    ASSERT (SELECT COUNT(*) FROM library_volumes WHERE series_id = section || '-a') = 3, 'Removed series must retain volumes';
    ASSERT (SELECT COUNT(*) FROM user_to_volumes WHERE volume_id LIKE section || '-a-%' AND is_read) = 3, 'Removed series must retain progress';
    SELECT array_agg(v.id ORDER BY sv.position, v.sort_title, v.id) INTO actual
    FROM library_series_volumes sv JOIN library_volumes v ON v.id = sv.volume_id WHERE sv.series_id = section || '-logical';
    ASSERT actual = ARRAY[section || '-b-1', section || '-b-2', section || '-b-3', section || '-c-1'], 'Added members must follow the new order';

    BEGIN
      DELETE FROM logical_series_members WHERE logical_series_id = section || '-logical';
      INSERT INTO logical_series_members VALUES (section || '-logical', section || '-a', 1), (section || '-logical', section || '-b', 1);
      RAISE EXCEPTION 'Duplicate positions accepted';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    ASSERT EXISTS (SELECT 1 FROM logical_series_members WHERE logical_series_id = section || '-logical' AND series_id = section || '-c'), 'Failed updates must retain prior members';

    DELETE FROM logical_series_members WHERE logical_series_id = section || '-logical';
    INSERT INTO logical_series_members VALUES (section || '-logical', section || '-a', 1), (section || '-logical', section || '-b', 2);
  END LOOP;
END $$;

DELETE FROM library_series WHERE id IN ('manga-c', 'comic-c', 'other-c');

INSERT INTO book_series (id, slug, title, sort_title, path) VALUES ('book-c', 'book-c', 'Extra books', 'extra books', '/books/c');
INSERT INTO book_volumes (id, series_id, slug, title, sort_title, filename, full_path, number)
VALUES ('book-c-1', 'book-c', 'book-c-1', 'Extra book', 'extra book', '1.epub', '/books/c/1.epub', 1);
INSERT INTO user_to_book_series (id, user_id, series_id, is_favorite) VALUES ('book-favorite', 'reader', 'book-logical', TRUE);
UPDATE book_series SET status = 'HIATUS' WHERE id = 'book-logical';
DELETE FROM logical_book_series_members WHERE logical_series_id = 'book-logical';
INSERT INTO logical_book_series_members VALUES ('book-logical', 'book-b', 1), ('book-logical', 'book-c', 2);
UPDATE book_series SET title = 'Updated books', sort_title = 'updated books', updated_at = NOW() WHERE id = 'book-logical';

DO $$
DECLARE actual TEXT[];
BEGIN
  ASSERT EXISTS (SELECT 1 FROM book_series WHERE id = 'book-logical' AND slug = 'book-logical' AND title = 'Updated books' AND status = 'HIATUS'), 'Editing books must preserve identity and status';
  ASSERT EXISTS (SELECT 1 FROM user_to_book_series WHERE series_id = 'book-logical' AND is_favorite), 'Editing books must preserve favorites';
  ASSERT NOT EXISTS (SELECT 1 FROM logical_book_series_members WHERE series_id = 'book-a'), 'Removed books must become available';
  ASSERT (SELECT COUNT(*) FROM book_volumes WHERE series_id = 'book-a') = 3, 'Removed book series must retain volumes';
  SELECT array_agg(v.id ORDER BY sv.position, v.number, v.sort_title, v.id) INTO actual
  FROM book_series_volumes sv JOIN book_volumes v ON v.id = sv.volume_id WHERE sv.series_id = 'book-logical';
  ASSERT actual = ARRAY['book-b-1', 'book-b-2', 'book-b-3', 'book-c-1'], 'Books must use the new member order';
END $$;

DELETE FROM logical_book_series_members WHERE logical_series_id = 'book-logical';
INSERT INTO logical_book_series_members VALUES ('book-logical', 'book-a', 1), ('book-logical', 'book-b', 2);
DELETE FROM book_series WHERE id = 'book-c';
