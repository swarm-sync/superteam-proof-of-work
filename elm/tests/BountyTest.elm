module BountyTest exposing (suite)

{-| Unit tests for the pure bounty logic in `Bounty`.

Covers status parsing/labels, case-insensitive search, status filtering,
and all four sort orders, including the empty-query and no-match edges.

-}

import Bounty exposing (Bounty, Sort(..), Status(..), filterBounties, matchesQuery, sampleBounties, sortBounties, statusFromString, statusLabel)
import Expect
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Bounty"
        [ describe "statusFromString"
            [ test "parses open" <|
                \_ -> Expect.equal (Just Open) (statusFromString "open")
            , test "parses in-review" <|
                \_ -> Expect.equal (Just InReview) (statusFromString "in-review")
            , test "parses closed" <|
                \_ -> Expect.equal (Just Closed) (statusFromString "closed")
            , test "rejects unknown status" <|
                \_ -> Expect.equal Nothing (statusFromString "pending")
            , test "is case-sensitive" <|
                \_ -> Expect.equal Nothing (statusFromString "Open")
            ]
        , describe "statusLabel"
            [ test "labels Open" <|
                \_ -> Expect.equal "Open" (statusLabel Open)
            , test "labels InReview" <|
                \_ -> Expect.equal "In review" (statusLabel InReview)
            , test "labels Closed" <|
                \_ -> Expect.equal "Closed" (statusLabel Closed)
            ]
        , describe "matchesQuery"
            [ test "empty query matches everything" <|
                \_ ->
                    sampleBounties
                        |> List.map (matchesQuery "")
                        |> Expect.equal (List.repeat 8 True)
            , test "matches title case-insensitively" <|
                \_ ->
                    let
                        found =
                            List.filter (matchesQuery "TICKER") sampleBounties
                    in
                    Expect.equal [ 8 ] (List.map .id found)
            , test "matches a skill" <|
                \_ ->
                    let
                        found =
                            List.filter (matchesQuery "accessibility") sampleBounties
                    in
                    Expect.equal [ 2, 6 ] (List.map .id found)
            , test "matches the org" <|
                \_ ->
                    let
                        found =
                            List.filter (matchesQuery "open dex") sampleBounties
                    in
                    Expect.equal [ 2, 8 ] (List.map .id found)
            , test "no match returns False" <|
                \_ ->
                    sampleBounties
                        |> List.map (matchesQuery "zzzz-no-such-thing")
                        |> Expect.equal (List.repeat 8 False)
            , test "leading/trailing spaces are ignored" <|
                \_ ->
                    let
                        found =
                            List.filter (matchesQuery "  ticker  ") sampleBounties
                    in
                    Expect.equal [ 8 ] (List.map .id found)
            ]
        , describe "filterBounties"
            [ test "open-only filter" <|
                \_ ->
                    filterBounties "" (Just Open) sampleBounties
                        |> List.map .id
                        |> Expect.equal [ 1, 2, 4, 6 ]
            , test "in-review filter" <|
                \_ ->
                    filterBounties "" (Just InReview) sampleBounties
                        |> List.map .id
                        |> Expect.equal [ 3, 7 ]
            , test "closed filter" <|
                \_ ->
                    filterBounties "" (Just Closed) sampleBounties
                        |> List.map .id
                        |> Expect.equal [ 5, 8 ]
            , test "query plus status combine" <|
                \_ ->
                    filterBounties "elm" (Just Open) sampleBounties
                        |> List.map .id
                        |> Expect.equal [ 1, 6 ]
            , test "query with no matches is empty" <|
                \_ ->
                    filterBounties "nope" Nothing sampleBounties
                        |> Expect.equal []
            ]
        , describe "sortBounties"
            [ test "highest reward first" <|
                \_ ->
                    sortBounties RewardHigh sampleBounties
                        |> List.map .reward
                        |> Expect.equal [ 3200, 2500, 2100, 1800, 1500, 1200, 900, 750 ]
            , test "lowest reward first" <|
                \_ ->
                    sortBounties RewardLow sampleBounties
                        |> List.map .reward
                        |> Expect.equal [ 750, 900, 1200, 1500, 1800, 2100, 2500, 3200 ]
            , test "deadline soonest first" <|
                \_ ->
                    sortBounties DeadlineSoon sampleBounties
                        |> List.map .id
                        |> Expect.equal [ 5, 8, 7, 2, 6, 3, 1, 4 ]
            , test "title A-Z, case-insensitive" <|
                \_ ->
                    sortBounties TitleAZ sampleBounties
                        |> List.map .id
                        |> Expect.equal [ 6, 1, 2, 5, 7, 8, 3, 4 ]
            , test "sorting an empty list is safe" <|
                \_ ->
                    sortBounties RewardHigh []
                        |> Expect.equal []
            ]
        ]
