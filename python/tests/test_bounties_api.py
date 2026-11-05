"""End-to-end API tests: the full HTTP surface, success and failure paths."""

from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient

FUTURE = (date.today() + timedelta(days=30)).isoformat()
PAST = (date.today() - timedelta(days=1)).isoformat()

VALID_PAYLOAD = {
    "title": "Build a Solana escrow program",
    "description": "Anchor program with escrow, dispute resolution, and tests.",
    "sponsor": "Solana Foundation",
    "reward_usd": 3000,
    "deadline": FUTURE,
    "skills": ["development"],
}


def test_health_reports_seed_count(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["bounties"] == 5  # demo seed dataset


def test_list_returns_seeded_bounties_paginated(client: TestClient) -> None:
    resp = client.get("/bounties")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    assert body["page"] == 1
    assert body["pages"] == 1
    assert len(body["items"]) == 5


def test_list_pagination_slices(client: TestClient) -> None:
    page1 = client.get("/bounties", params={"page": 1, "page_size": 2}).json()
    page2 = client.get("/bounties", params={"page": 2, "page_size": 2}).json()
    page3 = client.get("/bounties", params={"page": 3, "page_size": 2}).json()
    assert page1["pages"] == 3
    assert len(page1["items"]) == 2
    assert len(page2["items"]) == 2
    assert len(page3["items"]) == 1
    ids = [b["id"] for b in page1["items"] + page2["items"] + page3["items"]]
    assert len(set(ids)) == 5  # no duplicates across pages


def test_list_filter_by_status(client: TestClient) -> None:
    body = client.get("/bounties", params={"status": "in_review"}).json()
    assert body["total"] == 1
    assert body["items"][0]["sponsor"] == "Tensor"


def test_list_filter_by_skill_and_min_reward(client: TestClient) -> None:
    body = client.get("/bounties", params={"skill": "research", "min_reward_usd": 1000}).json()
    assert body["total"] == 1
    assert body["items"][0]["sponsor"] == "Streamflow"


def test_list_filter_by_sponsor_substring(client: TestClient) -> None:
    body = client.get("/bounties", params={"sponsor": "solana"}).json()
    assert body["total"] == 1  # case-insensitive substring match


def test_list_sort_by_reward_ascending(client: TestClient) -> None:
    body = client.get("/bounties", params={"sort_by": "reward_usd", "sort_dir": "asc"}).json()
    rewards = [b["reward_usd"] for b in body["items"]]
    assert rewards == sorted(rewards)
    assert rewards[0] == 800


def test_list_invalid_filter_range_rejected(client: TestClient) -> None:
    resp = client.get("/bounties", params={"min_reward_usd": 5000, "max_reward_usd": 100})
    assert resp.status_code == 422


def test_list_invalid_page_rejected(client: TestClient) -> None:
    assert client.get("/bounties", params={"page": 0}).status_code == 422
    assert client.get("/bounties", params={"page_size": 101}).status_code == 422


def test_create_bounty_returns_201_with_id(client: TestClient) -> None:
    resp = client.post("/bounties", json=VALID_PAYLOAD)
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == 6
    assert body["title"] == VALID_PAYLOAD["title"]
    assert body["status"] == "open"
    assert body["created_at"] and body["updated_at"]


def test_create_rejects_past_deadline(client: TestClient) -> None:
    payload = {**VALID_PAYLOAD, "deadline": PAST}
    resp = client.post("/bounties", json=payload)
    assert resp.status_code == 422


def test_create_rejects_zero_reward_and_duplicate_skills(client: TestClient) -> None:
    assert client.post("/bounties", json={**VALID_PAYLOAD, "reward_usd": 0}).status_code == 422
    assert (
        client.post(
            "/bounties", json={**VALID_PAYLOAD, "skills": ["development", "development"]}
        ).status_code
        == 422
    )


def test_create_rejects_short_title(client: TestClient) -> None:
    assert client.post("/bounties", json={**VALID_PAYLOAD, "title": "x"}).status_code == 422


def test_get_one_and_404(client: TestClient) -> None:
    resp = client.get("/bounties/1")
    assert resp.status_code == 200
    assert resp.json()["sponsor"] == "Solana Labs"

    missing = client.get("/bounties/999")
    assert missing.status_code == 404
    assert missing.json()["code"] == "bounty_not_found"


def test_update_bounty_partial(client: TestClient) -> None:
    resp = client.patch("/bounties/1", json={"reward_usd": 9999, "status": "closed"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["reward_usd"] == 9999
    assert body["status"] == "closed"
    assert body["title"] == "Build a Solana wallet balance dashboard"  # untouched


def test_update_empty_payload_rejected(client: TestClient) -> None:
    assert client.patch("/bounties/1", json={}).status_code == 422


def test_update_missing_bounty_404(client: TestClient) -> None:
    assert client.patch("/bounties/999", json={"reward_usd": 10}).status_code == 404


def test_delete_bounty_then_gone(client: TestClient) -> None:
    assert client.delete("/bounties/1").status_code == 204
    assert client.get("/bounties/1").status_code == 404
    assert client.get("/health").json()["bounties"] == 4


def test_delete_missing_bounty_404(client: TestClient) -> None:
    assert client.delete("/bounties/999").status_code == 404


def test_empty_store_lists_zero(empty_client: TestClient) -> None:
    body = empty_client.get("/bounties").json()
    assert body == {"items": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}
