/* test_bounty.c — unit tests for the bounty library + CLI smoke checks.
 * No framework, no dependencies: a tiny CHECK macro, exit code 1 on failure.
 * Run with: make test
 */
#include "bounty.h"

#include <stdio.h>
#include <string.h>

static int g_passed = 0, g_failed = 0;

#define CHECK(cond) do { \
    if (cond) { g_passed++; } \
    else { g_failed++; printf("  FAIL %s:%d: %s\n", __FILE__, __LINE__, #cond); } \
} while (0)

static const char *SAMPLE_TSV =
    "id\ttitle\tcategory\tstatus\treward_usd\tdeadline\n"
    "1\tFix the login redirect\tSecurity\topen\t500\t2026-12-01\n"
    "2\tWrite the onboarding guide\tDocs\topen\t150\t2026-11-20\n"
    "3\tRedesign the bounty board\tDesign\tclosed\t1200\t2026-10-15\n"
    "4\tAdd rate limiting to the API\tBackend\topen\t900\t2026-11-30\n"
    "5\tAudit the escrow contract\tSecurity\tdraft\t2500\t2027-01-15\n"
    "6\tDark mode for the dashboard\tFrontend\topen\t300\t2026-12-10\n";

static bounty_list_t load_sample(void)
{
    bounty_list_t list;
    bounty_list_init(&list);
    if (bounty_parse_buffer(SAMPLE_TSV, strlen(SAMPLE_TSV), &list, NULL) != 0) {
        printf("  FAIL: sample data did not parse\n");
        g_failed++;
    }
    return list;
}

/* --- parsing & validation --- */

static void test_parse_valid_line(void)
{
    bounty_t b;
    CHECK(bounty_parse_line(
        "42\tFix the login redirect\tSecurity\topen\t500\t2026-12-01", &b) == 0);
    CHECK(b.id == 42);
    CHECK(strcmp(b.title, "Fix the login redirect") == 0);
    CHECK(strcmp(b.category, "Security") == 0);
    CHECK(b.status == BOUNTY_OPEN);
    CHECK(b.reward_usd == 500);
    CHECK(strcmp(b.deadline, "2026-12-01") == 0);
}

static void test_parse_rejects_bad_lines(void)
{
    bounty_t b;
    long bad = 0;
    /* too few fields */
    CHECK(bounty_parse_line("1\tOnly two fields", &b) != 0);
    /* id must be a positive integer */
    CHECK(bounty_parse_line("abc\tT\tSecurity\topen\t100\t2026-12-01", &b) != 0);
    CHECK(bounty_parse_line("0\tT\tSecurity\topen\t100\t2026-12-01", &b) != 0);
    CHECK(bounty_parse_line("-3\tT\tSecurity\topen\t100\t2026-12-01", &b) != 0);
    /* empty title / category */
    CHECK(bounty_parse_line("1\t\tSecurity\topen\t100\t2026-12-01", &b) != 0);
    CHECK(bounty_parse_line("1\tT\t\topen\t100\t2026-12-01", &b) != 0);
    /* unknown status */
    CHECK(bounty_parse_line("1\tT\tSecurity\tpending\t100\t2026-12-01", &b) != 0);
    /* negative reward, non-numeric reward */
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\t-5\t2026-12-01", &b) != 0);
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\tmany\t2026-12-01", &b) != 0);
    /* impossible / malformed dates */
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\t100\t2026-02-30", &b) != 0);
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\t100\t2026-13-01", &b) != 0);
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\t100\t12/01/2026", &b) != 0);
    /* leap years: 2028-02-29 is real, 2027-02-29 is not */
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\t100\t2028-02-29", &b) == 0);
    CHECK(bounty_parse_line("1\tT\tSecurity\topen\t100\t2027-02-29", &b) != 0);
    /* buffer parse reports the bad line number */
    const char *bad_tsv =
        "id\ttitle\tcategory\tstatus\treward_usd\tdeadline\n"
        "1\tGood one\tDocs\topen\t100\t2026-12-01\n"
        "2\tBad one\tDocs\topen\t-1\t2026-12-01\n";
    bounty_list_t list;
    bounty_list_init(&list);
    CHECK(bounty_parse_buffer(bad_tsv, strlen(bad_tsv), &list, &bad) != 0);
    CHECK(bad == 3);
    bounty_list_free(&list);
}

static void test_parse_sample_counts(void)
{
    bounty_list_t list = load_sample();
    CHECK(list.count == 6);
    CHECK(list.items[0].id == 1);
    CHECK(list.items[5].reward_usd == 300);
    bounty_list_free(&list);
}

static void test_status_roundtrip(void)
{
    bounty_status_t st;
    CHECK(bounty_status_from_string("open", &st) == 0 && st == BOUNTY_OPEN);
    CHECK(bounty_status_from_string("closed", &st) == 0 && st == BOUNTY_CLOSED);
    CHECK(bounty_status_from_string("draft", &st) == 0 && st == BOUNTY_DRAFT);
    CHECK(bounty_status_from_string("OPEN", &st) != 0);
    CHECK(bounty_status_from_string("", &st) != 0);
    CHECK(strcmp(bounty_status_name(BOUNTY_CLOSED), "closed") == 0);
}

/* --- filter --- */

static void test_filter_status(void)
{
    bounty_list_t list = load_sample(), out;
    bounty_status_t st = BOUNTY_OPEN;
    CHECK(bounty_filter(&list, &out, &st, NULL, -1) == 0);
    CHECK(out.count == 4);
    for (size_t i = 0; i < out.count; i++)
        CHECK(out.items[i].status == BOUNTY_OPEN);
    bounty_list_free(&out);
    bounty_list_free(&list);
}

static void test_filter_category_and_min_reward(void)
{
    bounty_list_t list = load_sample(), out;
    CHECK(bounty_filter(&list, &out, NULL, "Security", -1) == 0);
    CHECK(out.count == 2);
    bounty_list_free(&out);
    CHECK(bounty_filter(&list, &out, NULL, NULL, 1000) == 0);
    CHECK(out.count == 2); /* 1200 and 2500 */
    bounty_list_free(&out);
    bounty_status_t st = BOUNTY_OPEN;
    CHECK(bounty_filter(&list, &out, &st, "Security", 400) == 0);
    CHECK(out.count == 1 && out.items[0].id == 1);
    bounty_list_free(&out);
    bounty_list_free(&list);
}

/* --- sort --- */

static void test_sort_by_reward(void)
{
    bounty_list_t list = load_sample();
    bounty_sort_by_reward(&list);
    CHECK(list.items[0].reward_usd == 2500);
    CHECK(list.items[1].reward_usd == 1200);
    CHECK(list.items[5].reward_usd == 150);
    for (size_t i = 1; i < list.count; i++)
        CHECK(list.items[i - 1].reward_usd >= list.items[i].reward_usd);
    bounty_list_free(&list);
}

static void test_sort_by_deadline(void)
{
    bounty_list_t list = load_sample();
    bounty_sort_by_deadline(&list);
    CHECK(strcmp(list.items[0].deadline, "2026-10-15") == 0);
    CHECK(strcmp(list.items[5].deadline, "2027-01-15") == 0);
    for (size_t i = 1; i < list.count; i++)
        CHECK(list.items[i - 1].deadline_t <= list.items[i].deadline_t);
    bounty_list_free(&list);
}

static void test_sort_by_title(void)
{
    bounty_list_t list = load_sample();
    bounty_sort_by_title(&list);
    CHECK(strncmp(list.items[0].title, "Add rate", 8) == 0);
    CHECK(strncmp(list.items[5].title, "Write the", 9) == 0);
    bounty_list_free(&list);
}

/* --- search & lookup --- */

static void test_search_case_insensitive(void)
{
    bounty_list_t list = load_sample(), out;
    CHECK(bounty_search(&list, "LOGIN", &out) == 0);
    CHECK(out.count == 1 && out.items[0].id == 1);
    bounty_list_free(&out);
    CHECK(bounty_search(&list, "security", &out) == 0);
    CHECK(out.count == 2); /* title or category match */
    bounty_list_free(&out);
    CHECK(bounty_search(&list, "zzz-no-match", &out) == 0);
    CHECK(out.count == 0);
    bounty_list_free(&out);
    bounty_list_free(&list);
}

static void test_find_linear_vs_binary(void)
{
    bounty_list_t list = load_sample();
    CHECK(bounty_find_linear(&list, 4) == 3);
    CHECK(bounty_find_linear(&list, 99) == -1);
    bounty_sort_by_id(&list);
    CHECK(bounty_find_binary(&list, 1) == 0);
    CHECK(bounty_find_binary(&list, 6) == 5);
    CHECK(bounty_find_binary(&list, 99) == -1);
    /* both agree on every id in the list */
    for (long id = 1; id <= 6; id++)
        CHECK(bounty_find_linear(&list, id) == bounty_find_binary(&list, id));
    bounty_list_free(&list);
}

/* --- list growth / edge cases --- */

static void test_large_list_grows(void)
{
    bounty_list_t list;
    bounty_list_init(&list);
    for (long i = 1; i <= 5000; i++) {
        bounty_t b;
        char line[256];
        snprintf(line, sizeof line,
                 "%ld\tTask %ld\tBackend\topen\t%ld\t2026-12-01",
                 i, i, i * 10);
        CHECK(bounty_parse_line(line, &b) == 0);
        CHECK(bounty_list_push(&list, &b) == 0);
    }
    CHECK(list.count == 5000);
    CHECK(list.items[4999].id == 5000);
    CHECK(list.items[4999].reward_usd == 50000);
    bounty_list_free(&list);
}

static void test_empty_and_header_only(void)
{
    bounty_list_t list;
    long bad = 0;
    bounty_list_init(&list);
    CHECK(bounty_parse_buffer("", 0, &list, &bad) == 0);
    CHECK(list.count == 0);
    bounty_list_free(&list);
    bounty_list_init(&list);
    const char *hdr = "id\ttitle\tcategory\tstatus\treward_usd\tdeadline\n";
    CHECK(bounty_parse_buffer(hdr, strlen(hdr), &list, &bad) == 0);
    CHECK(list.count == 0);
    bounty_list_free(&list);
}

int main(void)
{
    test_parse_valid_line();
    test_parse_rejects_bad_lines();
    test_parse_sample_counts();
    test_status_roundtrip();
    test_filter_status();
    test_filter_category_and_min_reward();
    test_sort_by_reward();
    test_sort_by_deadline();
    test_sort_by_title();
    test_search_case_insensitive();
    test_find_linear_vs_binary();
    test_large_list_grows();
    test_empty_and_header_only();

    printf("tests: %d passed, %d failed\n", g_passed, g_failed);
    return g_failed == 0 ? 0 : 1;
}
