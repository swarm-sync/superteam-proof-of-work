/* bounty.h — bounty-listings library: parse, validate, filter, sort, search.
 * Dependency-free C11. No I/O inside the core functions except where noted,
 * so the same code is exercised by the CLI, the tests, and the benchmark.
 */
#ifndef BOUNTY_H
#define BOUNTY_H

#include <stddef.h>
#include <time.h>

#define BOUNTY_MAX_TITLE    256
#define BOUNTY_MAX_CATEGORY 64
#define BOUNTY_MAX_STATUS   16
#define BOUNTY_DATE_LEN     11 /* "YYYY-MM-DD" + NUL */

typedef enum {
    BOUNTY_OPEN = 0,
    BOUNTY_CLOSED,
    BOUNTY_DRAFT
} bounty_status_t;

typedef struct {
    long   id;
    char   title[BOUNTY_MAX_TITLE];
    char   category[BOUNTY_MAX_CATEGORY];
    bounty_status_t status;
    long   reward_usd;              /* whole USD */
    char   deadline[BOUNTY_DATE_LEN];
    time_t deadline_t;              /* parsed deadline, for sorting */
} bounty_t;

typedef struct {
    bounty_t *items;
    size_t    count;
    size_t    capacity;
} bounty_list_t;

/* Parse one TSV line (no trailing newline required). Fields:
 *   id \t title \t category \t status \t reward_usd \t deadline
 * Returns 0 on success, -1 on malformed input (line left untouched). */
int bounty_parse_line(const char *line, bounty_t *out);

/* Parse a whole TSV buffer (header line optional, skipped if it starts
 * with "id\t"). Returns 0 on success; on the first bad data line returns
 * -1 and stores the 1-based line number in *bad_line (may be NULL). */
int bounty_parse_buffer(const char *buf, size_t len, bounty_list_t *out,
                        long *bad_line);

/* Parse a TSV file. Returns 0 on success, -1 on I/O error or bad line
 * (line number in *bad_line when non-NULL). */
int bounty_parse_file(const char *path, bounty_list_t *out, long *bad_line);

void bounty_list_init(bounty_list_t *list);
void bounty_list_free(bounty_list_t *list);
int  bounty_list_push(bounty_list_t *list, const bounty_t *item);

/* Status helpers. */
int  bounty_status_from_string(const char *s, bounty_status_t *out);
const char *bounty_status_name(bounty_status_t s);

/* Filter: keep items matching all set criteria (NULL/-1 = unset).
 * Writes matches into *dst (fresh list; caller frees). */
int bounty_filter(const bounty_list_t *src, bounty_list_t *dst,
                  const bounty_status_t *status, const char *category,
                  long min_reward /* -1 = unset */);

/* Sort in place. */
void bounty_sort_by_reward(bounty_list_t *list);    /* highest first */
void bounty_sort_by_deadline(bounty_list_t *list);  /* soonest first */
void bounty_sort_by_title(bounty_list_t *list);     /* A-Z, case-insensitive */
void bounty_sort_by_id(bounty_list_t *list);        /* ascending */

/* Case-insensitive substring search over title + category.
 * Writes matches into *dst (fresh list; caller frees). */
int bounty_search(const bounty_list_t *src, const char *term, bounty_list_t *dst);

/* Linear scan by id (baseline) and binary search by id (requires
 * bounty_sort_by_id first). Return index or -1. */
long bounty_find_linear(const bounty_list_t *list, long id);
long bounty_find_binary(const bounty_list_t *list, long id);

/* Monotonic clock, seconds as double. */
double bounty_now_seconds(void);

#endif /* BOUNTY_H */
