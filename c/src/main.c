/* main.c — `bounty` CLI: list / validate / bench bounty listings (TSV).
 *
 *   bounty list    --file data/sample.tsv [--status open] [--category X]
 *                    [--min-reward N] [--sort reward|deadline|title]
 *                    [--search TERM] [--limit N]
 *   bounty validate --file data/sample.tsv
 *   bounty bench   [--n N] [--iters I]
 *
 * Exit codes: 0 ok, 1 usage error, 2 file/parse error.
 */
#define _POSIX_C_SOURCE 200809L
#include "bounty.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void usage(FILE *out)
{
    fprintf(out,
        "bounty — fast bounty-listings CLI\n"
        "\n"
        "Usage:\n"
        "  bounty list    --file FILE [--status open|closed|draft]\n"
        "                 [--category NAME] [--min-reward USD]\n"
        "                 [--sort reward|deadline|title] [--search TERM]\n"
        "                 [--limit N]\n"
        "  bounty validate --file FILE\n"
        "  bounty bench   [--n N] [--iters I]\n"
        "  bounty --help\n"
        "\n"
        "Listings file (TSV, header optional):\n"
        "  id<TAB>title<TAB>category<TAB>status<TAB>reward_usd<TAB>deadline\n"
        "  e.g. 12<TAB>Fix the login redirect<TAB>Security<TAB>open<TAB>500<TAB>2026-12-01\n");
}

static void print_row(const bounty_t *b)
{
    printf("%-6ld $%-7ld %-10s %-12s %s  (%s)\n",
           b->id, b->reward_usd, bounty_status_name(b->status),
           b->category, b->title, b->deadline);
}

static const char *opt_value(int argc, char **argv, const char *name,
                             const char *def)
{
    for (int i = 2; i + 1 < argc; i++) {
        if (strcmp(argv[i], name) == 0)
            return argv[i + 1];
    }
    return def;
}

static long opt_long(const char *s, long def)
{
    char *end = NULL;
    long v;
    if (s == NULL)
        return def;
    v = strtol(s, &end, 10);
    return (end != s && *end == '\0') ? v : def;
}

/* ------------------------------------------------------------------ */
/* list                                                                */
/* ------------------------------------------------------------------ */

static int cmd_list(int argc, char **argv)
{
    const char *file = opt_value(argc, argv, "--file", NULL);
    const char *status_s = opt_value(argc, argv, "--status", NULL);
    const char *category = opt_value(argc, argv, "--category", NULL);
    const char *sort = opt_value(argc, argv, "--sort", NULL);
    const char *search = opt_value(argc, argv, "--search", NULL);
    long min_reward = opt_long(opt_value(argc, argv, "--min-reward", NULL), -1);
    long limit = opt_long(opt_value(argc, argv, "--limit", NULL), -1);
    bounty_list_t all, out;
    bounty_status_t st;
    const bounty_status_t *stp = NULL;
    long bad_line = 0;
    int rc = 0;

    if (file == NULL) {
        fprintf(stderr, "bounty list: --file FILE is required\n");
        return 1;
    }
    if (status_s != NULL) {
        if (bounty_status_from_string(status_s, &st) != 0) {
            fprintf(stderr, "bounty list: unknown status '%s'\n", status_s);
            return 1;
        }
        stp = &st;
    }
    if (sort != NULL && strcmp(sort, "reward") != 0 &&
        strcmp(sort, "deadline") != 0 && strcmp(sort, "title") != 0) {
        fprintf(stderr, "bounty list: --sort must be reward|deadline|title\n");
        return 1;
    }

    bounty_list_init(&all);
    if (bounty_parse_file(file, &all, &bad_line) != 0) {
        if (bad_line == 0)
            fprintf(stderr, "bounty list: cannot read '%s'\n", file);
        else
            fprintf(stderr, "bounty list: cannot parse '%s' (bad line %ld)\n",
                    file, bad_line);
        bounty_list_free(&all);
        return 2;
    }

    if (bounty_filter(&all, &out, stp, category, min_reward) != 0) {
        fprintf(stderr, "bounty list: out of memory\n");
        bounty_list_free(&all);
        return 2;
    }
    if (search != NULL) {
        bounty_list_t found;
        if (bounty_search(&out, search, &found) != 0) {
            fprintf(stderr, "bounty list: out of memory\n");
            rc = 2;
            goto done;
        }
        bounty_list_free(&out);
        out = found;
    }

    if (sort != NULL) {
        if (strcmp(sort, "reward") == 0)
            bounty_sort_by_reward(&out);
        else if (strcmp(sort, "deadline") == 0)
            bounty_sort_by_deadline(&out);
        else
            bounty_sort_by_title(&out);
    }

    printf("%-6s %-8s %-10s %-12s %s\n", "ID", "REWARD", "STATUS", "CATEGORY", "TITLE");
    size_t shown = 0;
    for (size_t i = 0; i < out.count; i++) {
        if (limit >= 0 && (long)shown >= limit)
            break;
        print_row(&out.items[i]);
        shown++;
    }
    printf("%zu listing(s) shown of %zu total\n", shown, all.count);

done:
    bounty_list_free(&out);
    bounty_list_free(&all);
    return rc;
}

/* ------------------------------------------------------------------ */
/* validate                                                            */
/* ------------------------------------------------------------------ */

static int cmd_validate(int argc, char **argv)
{
    const char *file = opt_value(argc, argv, "--file", NULL);
    bounty_list_t all;
    long bad_line = 0;

    if (file == NULL) {
        fprintf(stderr, "bounty validate: --file FILE is required\n");
        return 1;
    }
    bounty_list_init(&all);
    if (bounty_parse_file(file, &all, &bad_line) != 0) {
        if (bad_line == 0)
            fprintf(stderr, "INVALID: cannot read '%s'\n", file);
        else
            fprintf(stderr, "INVALID: '%s' fails at line %ld\n", file, bad_line);
        bounty_list_free(&all);
        return 2;
    }
    printf("VALID: %zu listing(s) in '%s'\n", all.count, file);
    bounty_list_free(&all);
    return 0;
}

/* ------------------------------------------------------------------ */
/* bench — measured throughput, with a before/after comparison         */
/* ------------------------------------------------------------------ */

/* Deterministic pseudo-random generator (xorshift32) — same data every run. */
static unsigned xorshift32(unsigned *s)
{
    unsigned x = *s;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *s = x;
    return x;
}

static const char *const CATEGORIES[] = {
    "Security", "Frontend", "Backend", "Docs", "Design", "DevOps"
};
static const char *const STATUSES[] = { "open", "closed", "draft" };

/* Build an in-memory TSV buffer of n listings. Caller frees. */
static char *gen_tsv(size_t n, size_t *out_len)
{
    size_t cap = n * 96 + 128, len = 0;
    char *buf = malloc(cap);
    unsigned seed = 0xC0FFEEu;
    if (buf == NULL)
        return NULL;
    len += (size_t)snprintf(buf + len, cap - len,
        "id\ttitle\tcategory\tstatus\treward_usd\tdeadline\n");
    for (size_t i = 0; i < n; i++) {
        unsigned r = xorshift32(&seed);
        len += (size_t)snprintf(buf + len, cap - len,
            "%zu\tBounty task %zu\t%s\t%s\t%u\t2026-%02u-%02u\n",
            i + 1, i + 1,
            CATEGORIES[r % 6], STATUSES[(r >> 4) % 3],
            50 + (r % 4950), 1 + ((r >> 8) % 12), 1 + ((r >> 12) % 28));
    }
    *out_len = len;
    return buf;
}

/* Deliberately naive O(n^2) bubble sort by reward — the "before". */
static void bubble_sort_by_reward(bounty_list_t *list)
{
    for (size_t i = 0; i < list->count; i++) {
        for (size_t j = 0; j + 1 < list->count - i; j++) {
            if (list->items[j].reward_usd < list->items[j + 1].reward_usd) {
                bounty_t tmp = list->items[j];
                list->items[j] = list->items[j + 1];
                list->items[j + 1] = tmp;
            }
        }
    }
}

static int cmd_bench(int argc, char **argv)
{
    long n = opt_long(opt_value(argc, argv, "--n", NULL), 50000);
    long iters = opt_long(opt_value(argc, argv, "--iters", NULL), 5);
    size_t tsv_len = 0;
    char *tsv;
    double t0, t1;

    if (n <= 0 || iters <= 0) {
        fprintf(stderr, "bounty bench: --n and --iters must be positive\n");
        return 1;
    }
    tsv = gen_tsv((size_t)n, &tsv_len);
    if (tsv == NULL) {
        fprintf(stderr, "bounty bench: out of memory\n");
        return 2;
    }

    printf("bounty bench: n=%ld listings, iters=%ld\n", n, iters);

    /* 1. Parse + validate throughput (best of iters). */
    double best_parse = 1e9;
    bounty_list_t parsed;
    bounty_list_init(&parsed);
    for (long i = 0; i < iters; i++) {
        bounty_list_t tmp;
        bounty_list_init(&tmp);
        t0 = bounty_now_seconds();
        if (bounty_parse_buffer(tsv, tsv_len, &tmp, NULL) != 0) {
            fprintf(stderr, "bounty bench: generated data failed to parse\n");
            free(tsv);
            return 2;
        }
        t1 = bounty_now_seconds();
        if (t1 - t0 < best_parse)
            best_parse = t1 - t0;
        bounty_list_free(&tmp);
    }
    if (bounty_parse_buffer(tsv, tsv_len, &parsed, NULL) != 0) {
        free(tsv);
        return 2;
    }
    printf("  parse+validate : %8.3f ms  (%9.0f listings/sec, %6.1f ns/listing)\n",
           best_parse * 1e3, (double)n / best_parse,
           best_parse * 1e9 / (double)n);

    /* 2. qsort by reward (best of iters). */
    double best_qsort = 1e9;
    for (long i = 0; i < iters; i++) {
        bounty_list_t tmp;
        bounty_list_init(&tmp);
        for (size_t k = 0; k < parsed.count; k++)
            bounty_list_push(&tmp, &parsed.items[k]);
        t0 = bounty_now_seconds();
        bounty_sort_by_reward(&tmp);
        t1 = bounty_now_seconds();
        if (t1 - t0 < best_qsort)
            best_qsort = t1 - t0;
        bounty_list_free(&tmp);
    }
    printf("  sort (qsort)   : %8.3f ms  (%9.0f listings/sec)\n",
           best_qsort * 1e3, (double)n / best_qsort);

    /* 3. Before/after: bubble sort on a 2,000-item slice vs qsort on it. */
    const size_t m = parsed.count < 2000 ? parsed.count : 2000;
    bounty_list_t slice_a, slice_b;
    bounty_list_init(&slice_a);
    bounty_list_init(&slice_b);
    for (size_t k = 0; k < m; k++) {
        bounty_list_push(&slice_a, &parsed.items[k]);
        bounty_list_push(&slice_b, &parsed.items[k]);
    }
    t0 = bounty_now_seconds();
    bubble_sort_by_reward(&slice_a);
    t1 = bounty_now_seconds();
    double bubble = t1 - t0;
    t0 = bounty_now_seconds();
    bounty_sort_by_reward(&slice_b);
    t1 = bounty_now_seconds();
    double q = t1 - t0;
    printf("  sort 2,000 items — bubble (before): %8.3f ms\n", bubble * 1e3);
    printf("  sort 2,000 items — qsort  (after) : %8.3f ms  (%.0fx faster)\n",
           q * 1e3, bubble / (q > 0 ? q : 1e-9));

    /* 4. Lookup: linear scan vs binary search (id-sorted), 100k lookups. */
    bounty_sort_by_id(&parsed);
    const long lookups = 100000;
    long hits = 0;
    t0 = bounty_now_seconds();
    for (long i = 0; i < lookups; i++) {
        if (bounty_find_linear(&parsed, (i % n) + 1) >= 0)
            hits++;
    }
    t1 = bounty_now_seconds();
    double linear = t1 - t0;
    t0 = bounty_now_seconds();
    for (long i = 0; i < lookups; i++) {
        if (bounty_find_binary(&parsed, (i % n) + 1) >= 0)
            hits++;
    }
    t1 = bounty_now_seconds();
    double binary = t1 - t0;
    printf("  lookup x%ld — linear scan: %8.3f ms (%.0f ns/lookup)\n",
           lookups, linear * 1e3, linear * 1e9 / (double)lookups);
    printf("  lookup x%ld — binary search: %8.3f ms (%.0f ns/lookup, %.0fx faster)\n",
           lookups, binary * 1e3, binary * 1e9 / (double)lookups,
           linear / (binary > 0 ? binary : 1e-9));
    printf("  (hits=%ld, expected %ld — sanity check)\n", hits, lookups * 2);

    bounty_list_free(&slice_a);
    bounty_list_free(&slice_b);
    bounty_list_free(&parsed);
    free(tsv);
    return 0;
}

/* ------------------------------------------------------------------ */

int main(int argc, char **argv)
{
    if (argc < 2 || strcmp(argv[1], "--help") == 0 ||
        strcmp(argv[1], "-h") == 0) {
        usage(stdout);
        return argc < 2 ? 1 : 0;
    }
    if (strcmp(argv[1], "list") == 0)
        return cmd_list(argc, argv);
    if (strcmp(argv[1], "validate") == 0)
        return cmd_validate(argc, argv);
    if (strcmp(argv[1], "bench") == 0)
        return cmd_bench(argc, argv);
    fprintf(stderr, "bounty: unknown command '%s'\n", argv[1]);
    usage(stderr);
    return 1;
}
