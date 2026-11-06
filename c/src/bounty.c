/* bounty.c — bounty-listings library implementation. C11, no dependencies. */
#define _POSIX_C_SOURCE 200809L
#include "bounty.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

static int parse_long(const char *s, long *out)
{
    char *end = NULL;
    long v;
    if (s == NULL || *s == '\0')
        return -1;
    v = strtol(s, &end, 10);
    if (end == s || *end != '\0')
        return -1;
    *out = v;
    return 0;
}

/* Strict YYYY-MM-DD -> time_t (midnight UTC). Rejects impossible dates.
 * Validated arithmetically (month lengths + leap years) and converted with
 * days-from-civil — no mktime() call, which profiling showed dominating
 * parse time (a localtime/tz lookup per line). */
static int parse_date(const char *s, time_t *out)
{
    static const int mdays[12] =
        { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
    int y, m, d;
    if (s == NULL || strlen(s) != 10 || s[4] != '-' || s[7] != '-')
        return -1;
    for (int i = 0; i < 10; i++) {
        if (i == 4 || i == 7)
            continue;
        if (!isdigit((unsigned char)s[i]))
            return -1;
    }
    y = atoi(s);
    m = atoi(s + 5);
    d = atoi(s + 8);
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1)
        return -1;
    int leap = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
    int maxd = mdays[m - 1] + (m == 2 && leap ? 1 : 0);
    if (d > maxd)
        return -1;
    /* Days from civil (Howard Hinnant's algorithm), epoch 1970-01-01. */
    int yy = m <= 2 ? y - 1 : y;
    int era = (yy >= 0 ? yy : yy - 399) / 400;
    unsigned yoe = (unsigned)(yy - era * 400);
    unsigned mp = (unsigned)((m + 9) % 12);
    unsigned doy = (153 * mp + 2) / 5 + (unsigned)(d - 1);
    unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    long days = (long)era * 146097 + (long)doe - 719468;
    *out = (time_t)days * 86400;
    return 0;
}

static int ci_contains(const char *haystack, const char *needle)
{
    size_t nlen;
    if (needle == NULL || *needle == '\0')
        return 1;
    nlen = strlen(needle);
    for (const char *p = haystack; *p; p++) {
        size_t i;
        for (i = 0; i < nlen; i++) {
            if (p[i] == '\0')
                return 0;
            if (tolower((unsigned char)p[i]) != tolower((unsigned char)needle[i]))
                break;
        }
        if (i == nlen)
            return 1;
    }
    return 0;
}

static int ci_cmp(const char *a, const char *b)
{
    while (*a && *b) {
        int d = tolower((unsigned char)*a) - tolower((unsigned char)*b);
        if (d != 0)
            return d;
        a++;
        b++;
    }
    return tolower((unsigned char)*a) - tolower((unsigned char)*b);
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

int bounty_status_from_string(const char *s, bounty_status_t *out)
{
    if (s == NULL)
        return -1;
    if (strcmp(s, "open") == 0)   { *out = BOUNTY_OPEN;   return 0; }
    if (strcmp(s, "closed") == 0) { *out = BOUNTY_CLOSED; return 0; }
    if (strcmp(s, "draft") == 0)  { *out = BOUNTY_DRAFT;  return 0; }
    return -1;
}

const char *bounty_status_name(bounty_status_t s)
{
    switch (s) {
    case BOUNTY_OPEN:   return "open";
    case BOUNTY_CLOSED: return "closed";
    case BOUNTY_DRAFT:  return "draft";
    default:            return "unknown";
    }
}

/* ------------------------------------------------------------------ */
/* List management                                                     */
/* ------------------------------------------------------------------ */

void bounty_list_init(bounty_list_t *list)
{
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
}

void bounty_list_free(bounty_list_t *list)
{
    free(list->items);
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
}

int bounty_list_push(bounty_list_t *list, const bounty_t *item)
{
    if (list->count == list->capacity) {
        size_t ncap = list->capacity ? list->capacity * 2 : 64;
        bounty_t *n = realloc(list->items, ncap * sizeof *n);
        if (n == NULL)
            return -1;
        list->items = n;
        list->capacity = ncap;
    }
    list->items[list->count++] = *item;
    return 0;
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/* Split a line into exactly 6 tab-separated fields. Returns field count. */
static int split_tabs(char *line, char *fields[6])
{
    int n = 0;
    char *p = line;
    fields[n++] = p;
    while (n < 6) {
        char *tab = strchr(p, '\t');
        if (tab == NULL)
            break;
        *tab = '\0';
        p = tab + 1;
        fields[n++] = p;
    }
    return n;
}

int bounty_parse_line(const char *line, bounty_t *out)
{
    char buf[1024];
    char *fields[6];
    long id, reward;
    bounty_status_t st;
    time_t dt;

    if (line == NULL || out == NULL)
        return -1;
    if (strlen(line) >= sizeof buf)
        return -1;
    strcpy(buf, line);
    /* Strip a trailing CR (CRLF files). */
    size_t blen = strlen(buf);
    if (blen > 0 && buf[blen - 1] == '\r')
        buf[blen - 1] = '\0';

    if (split_tabs(buf, fields) != 6)
        return -1;
    if (parse_long(fields[0], &id) != 0 || id <= 0)
        return -1;
    if (fields[1][0] == '\0' || strlen(fields[1]) >= BOUNTY_MAX_TITLE)
        return -1;
    if (fields[2][0] == '\0' || strlen(fields[2]) >= BOUNTY_MAX_CATEGORY)
        return -1;
    if (bounty_status_from_string(fields[3], &st) != 0)
        return -1;
    if (parse_long(fields[4], &reward) != 0 || reward < 0)
        return -1;
    if (parse_date(fields[5], &dt) != 0)
        return -1;

    memset(out, 0, sizeof *out);
    out->id = id;
    strcpy(out->title, fields[1]);
    strcpy(out->category, fields[2]);
    out->status = st;
    out->reward_usd = reward;
    strcpy(out->deadline, fields[5]);
    out->deadline_t = dt;
    return 0;
}

int bounty_parse_buffer(const char *buf, size_t len, bounty_list_t *out,
                        long *bad_line)
{
    char *copy, *saveptr = NULL, *line;
    long lineno = 0;
    int rc = 0;

    if (buf == NULL || out == NULL)
        return -1;
    copy = malloc(len + 1);
    if (copy == NULL)
        return -1;
    memcpy(copy, buf, len);
    copy[len] = '\0';

    line = strtok_r(copy, "\n", &saveptr);
    while (line != NULL) {
        lineno++;
        /* Skip a header row and blank lines. */
        if (lineno == 1 && strncmp(line, "id\t", 3) == 0) {
            line = strtok_r(NULL, "\n", &saveptr);
            continue;
        }
        if (line[0] == '\0') {
            line = strtok_r(NULL, "\n", &saveptr);
            continue;
        }
        bounty_t item;
        if (bounty_parse_line(line, &item) != 0) {
            if (bad_line != NULL)
                *bad_line = lineno;
            rc = -1;
            break;
        }
        if (bounty_list_push(out, &item) != 0) {
            rc = -1;
            break;
        }
        line = strtok_r(NULL, "\n", &saveptr);
    }
    free(copy);
    return rc;
}

int bounty_parse_file(const char *path, bounty_list_t *out, long *bad_line)
{
    FILE *f = fopen(path, "rb");
    long size;
    char *buf;
    int rc;

    if (f == NULL)
        return -1;
    if (fseek(f, 0, SEEK_END) != 0) { fclose(f); return -1; }
    size = ftell(f);
    if (size < 0) { fclose(f); return -1; }
    rewind(f);
    buf = malloc((size_t)size + 1);
    if (buf == NULL) { fclose(f); return -1; }
    if (size > 0 && fread(buf, 1, (size_t)size, f) != (size_t)size) {
        free(buf);
        fclose(f);
        return -1;
    }
    fclose(f);
    rc = bounty_parse_buffer(buf, (size_t)size, out, bad_line);
    free(buf);
    return rc;
}

/* ------------------------------------------------------------------ */
/* Filter / search                                                     */
/* ------------------------------------------------------------------ */

int bounty_filter(const bounty_list_t *src, bounty_list_t *dst,
                  const bounty_status_t *status, const char *category,
                  long min_reward)
{
    bounty_list_init(dst);
    for (size_t i = 0; i < src->count; i++) {
        const bounty_t *b = &src->items[i];
        if (status != NULL && b->status != *status)
            continue;
        if (category != NULL && strcmp(b->category, category) != 0)
            continue;
        if (min_reward >= 0 && b->reward_usd < min_reward)
            continue;
        if (bounty_list_push(dst, b) != 0) {
            bounty_list_free(dst);
            return -1;
        }
    }
    return 0;
}

int bounty_search(const bounty_list_t *src, const char *term, bounty_list_t *dst)
{
    bounty_list_init(dst);
    for (size_t i = 0; i < src->count; i++) {
        const bounty_t *b = &src->items[i];
        if (ci_contains(b->title, term) || ci_contains(b->category, term)) {
            if (bounty_list_push(dst, b) != 0) {
                bounty_list_free(dst);
                return -1;
            }
        }
    }
    return 0;
}

/* ------------------------------------------------------------------ */
/* Sort                                                                */
/* ------------------------------------------------------------------ */

static int cmp_reward(const void *a, const void *b)
{
    long d = ((const bounty_t *)b)->reward_usd - ((const bounty_t *)a)->reward_usd;
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
}

static int cmp_deadline(const void *a, const void *b)
{
    time_t d = ((const bounty_t *)a)->deadline_t - ((const bounty_t *)b)->deadline_t;
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
}

static int cmp_title(const void *a, const void *b)
{
    return ci_cmp(((const bounty_t *)a)->title, ((const bounty_t *)b)->title);
}

static int cmp_id(const void *a, const void *b)
{
    long d = ((const bounty_t *)a)->id - ((const bounty_t *)b)->id;
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
}

void bounty_sort_by_reward(bounty_list_t *list)
{
    qsort(list->items, list->count, sizeof(bounty_t), cmp_reward);
}

void bounty_sort_by_deadline(bounty_list_t *list)
{
    qsort(list->items, list->count, sizeof(bounty_t), cmp_deadline);
}

void bounty_sort_by_title(bounty_list_t *list)
{
    qsort(list->items, list->count, sizeof(bounty_t), cmp_title);
}

void bounty_sort_by_id(bounty_list_t *list)
{
    qsort(list->items, list->count, sizeof(bounty_t), cmp_id);
}

/* ------------------------------------------------------------------ */
/* Lookup                                                              */
/* ------------------------------------------------------------------ */

long bounty_find_linear(const bounty_list_t *list, long id)
{
    for (size_t i = 0; i < list->count; i++) {
        if (list->items[i].id == id)
            return (long)i;
    }
    return -1;
}

long bounty_find_binary(const bounty_list_t *list, long id)
{
    size_t lo = 0, hi = list->count;
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;
        if (list->items[mid].id == id)
            return (long)mid;
        if (list->items[mid].id < id)
            lo = mid + 1;
        else
            hi = mid;
    }
    return -1;
}

/* ------------------------------------------------------------------ */
/* Clock                                                               */
/* ------------------------------------------------------------------ */

double bounty_now_seconds(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec / 1e9;
}
