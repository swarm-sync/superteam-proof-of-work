module Bounty exposing
    ( Bounty
    , Sort(..)
    , Status(..)
    , filterBounties
    , matchesQuery
    , sampleBounties
    , sortBounties
    , statusFromString
    , statusLabel
    )

{-| Pure bounty data and filtering/sorting logic for the bounty board.

Keeping this logic in its own module (free of any HTML) is what makes it
directly unit-testable with elm-test.

-}


type Status
    = Open
    | InReview
    | Closed


type Sort
    = RewardHigh
    | RewardLow
    | DeadlineSoon
    | TitleAZ


type alias Bounty =
    { id : Int
    , title : String
    , org : String
    , reward : Int
    , status : Status
    , skills : List String
    , deadline : String
    , summary : String
    }


statusLabel : Status -> String
statusLabel status =
    case status of
        Open ->
            "Open"

        InReview ->
            "In review"

        Closed ->
            "Closed"


statusFromString : String -> Maybe Status
statusFromString raw =
    case raw of
        "open" ->
            Just Open

        "in-review" ->
            Just InReview

        "closed" ->
            Just Closed

        _ ->
            Nothing


{-| Case-insensitive substring search across title, org, skills and summary.
An empty query matches everything.
-}
matchesQuery : String -> Bounty -> Bool
matchesQuery query bounty =
    let
        needle =
            String.toLower (String.trim query)

        haystack =
            String.toLower
                (String.join " "
                    (bounty.title
                        :: bounty.org
                        :: bounty.summary
                        :: bounty.skills
                    )
                )
    in
    needle == "" || String.contains needle haystack


{-| Apply the search query and (optional) status filter.
`Nothing` for the status means "all statuses".
-}
filterBounties : String -> Maybe Status -> List Bounty -> List Bounty
filterBounties query maybeStatus bounties =
    bounties
        |> List.filter (matchesQuery query)
        |> List.filter
            (\bounty ->
                case maybeStatus of
                    Nothing ->
                        True

                    Just status ->
                        bounty.status == status
            )


sortBounties : Sort -> List Bounty -> List Bounty
sortBounties sort bounties =
    case sort of
        RewardHigh ->
            List.sortBy (\b -> -b.reward) bounties

        RewardLow ->
            List.sortBy .reward bounties

        DeadlineSoon ->
            List.sortBy .deadline bounties

        TitleAZ ->
            List.sortBy (\b -> String.toLower b.title) bounties


{-| Sample listings. Fictional Solana-ecosystem bounties used to demonstrate
the board; rewards are in USDC.
-}
sampleBounties : List Bounty
sampleBounties =
    [ { id = 1
      , title = "Build a token-gated docs portal"
      , org = "Solana DevRel Collective"
      , reward = 2500
      , status = Open
      , skills = [ "Elm", "Frontend", "Wallet Adapter" ]
      , deadline = "2026-12-15"
      , summary = "A small portal that checks a wallet for a membership token before showing gated guides."
      }
    , { id = 2
      , title = "Design system audit for a DEX dashboard"
      , org = "Open DEX Labs"
      , reward = 1800
      , status = Open
      , skills = [ "Design System", "Accessibility", "CSS" ]
      , deadline = "2026-11-30"
      , summary = "Audit the dashboard components against WCAG 2.1 AA and file fixes with before/after notes."
      }
    , { id = 3
      , title = "Solana Pay checkout widget"
      , org = "Checkout Collective"
      , reward = 3200
      , status = InReview
      , skills = [ "Elm", "Solana Pay", "Frontend" ]
      , deadline = "2026-12-05"
      , summary = "Embeddable checkout widget with payment status polling and accessible error states."
      }
    , { id = 4
      , title = "Write onboarding guides for new validators"
      , org = "Validator Commons"
      , reward = 900
      , status = Open
      , skills = [ "Technical Writing", "Solana" ]
      , deadline = "2026-12-20"
      , summary = "Three beginner-friendly guides: setup, monitoring, and safe key handling."
      }
    , { id = 5
      , title = "Mobile-first landing page for a hackathon"
      , org = "Hackathon Hub"
      , reward = 1200
      , status = Closed
      , skills = [ "Frontend", "Responsive Design" ]
      , deadline = "2026-11-10"
      , summary = "Landing page with schedule, prizes, and registration; must score 90+ on Lighthouse mobile."
      }
    , { id = 6
      , title = "Accessible transaction history table"
      , org = "Wallet Works"
      , reward = 2100
      , status = Open
      , skills = [ "Elm", "Accessibility", "Data Tables" ]
      , deadline = "2026-12-01"
      , summary = "Sortable, keyboard-navigable transaction table with screen-reader announcements."
      }
    , { id = 7
      , title = "NFT mint flow usability test report"
      , org = "Mint Studio"
      , reward = 750
      , status = InReview
      , skills = [ "UX Research", "Testing" ]
      , deadline = "2026-11-25"
      , summary = "Run five moderated sessions on the mint flow and deliver a prioritized issue report."
      }
    , { id = 8
      , title = "Real-time price ticker component"
      , org = "Open DEX Labs"
      , reward = 1500
      , status = Closed
      , skills = [ "Elm", "WebSockets", "Frontend" ]
      , deadline = "2026-11-18"
      , summary = "Live price ticker with pause-on-hover, reduced-motion support, and stale-data warnings."
      }
    ]
