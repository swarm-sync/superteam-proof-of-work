module Main exposing (main)

{-| Bounty board — a small Elm application built on The Elm Architecture.

The board lists fictional Solana-ecosystem bounties and lets the reader
search them, filter by status, and sort them. All data logic lives in
the pure `Bounty` module so it can be unit-tested without a browser;
this module only owns the Model / Msg / update / view loop.

-}

import Bounty exposing (Bounty, Sort(..), Status(..), filterBounties, sortBounties, statusLabel)
import Browser
import Html exposing (Html, div, h1, input, option, p, select, span, strong, text)
import Html.Attributes exposing (class, placeholder, selected, value)
import Html.Events exposing (on, onInput)
import Json.Decode as Decode



-- MODEL


type alias Model =
    { query : String
    , statusFilter : Maybe Status
    , sort : Sort
    , bounties : List Bounty
    }


init : Model
init =
    { query = ""
    , statusFilter = Nothing
    , sort = RewardHigh
    , bounties = Bounty.sampleBounties
    }



-- UPDATE


type Msg
    = QueryChanged String
    | StatusChanged String
    | SortChanged String


update : Msg -> Model -> Model
update msg model =
    case msg of
        QueryChanged query ->
            { model | query = query }

        StatusChanged raw ->
            { model
                | statusFilter =
                    case raw of
                        "all" ->
                            Nothing

                        _ ->
                            Bounty.statusFromString raw
            }

        SortChanged raw ->
            { model
                | sort =
                    case raw of
                        "reward-low" ->
                            RewardLow

                        "deadline" ->
                            DeadlineSoon

                        "title" ->
                            TitleAZ

                        _ ->
                            RewardHigh
            }



-- VIEW


visibleBounties : Model -> List Bounty
visibleBounties model =
    model.bounties
        |> filterBounties model.query model.statusFilter
        |> sortBounties model.sort


view : Model -> Html Msg
view model =
    div [ class "board" ]
        [ h1 [] [ text "Solana Bounty Board" ]
        , p [] [ text "Search, filter, and sort open bounties. Built with Elm — no runtime exceptions by construction." ]
        , div [ class "controls" ]
            [ input
                [ placeholder "Search title, org, or skill…"
                , value model.query
                , onInput QueryChanged
                ]
                []
            , select [ onStatusInput ]
                [ option [ value "all", selected (model.statusFilter == Nothing) ] [ text "All statuses" ]
                , option [ value "open", selected (model.statusFilter == Just Open) ] [ text "Open" ]
                , option [ value "in-review", selected (model.statusFilter == Just InReview) ] [ text "In review" ]
                , option [ value "closed", selected (model.statusFilter == Just Closed) ] [ text "Closed" ]
                ]
            , select [ onSortInput ]
                [ option [ value "reward-high", selected (model.sort == RewardHigh) ] [ text "Highest reward" ]
                , option [ value "reward-low", selected (model.sort == RewardLow) ] [ text "Lowest reward" ]
                , option [ value "deadline", selected (model.sort == DeadlineSoon) ] [ text "Deadline soonest" ]
                , option [ value "title", selected (model.sort == TitleAZ) ] [ text "Title A–Z" ]
                ]
            ]
        , div [ class "count" ]
            [ text
                (String.fromInt (List.length (visibleBounties model))
                    ++ " bounties shown of "
                    ++ String.fromInt (List.length model.bounties)
                )
            ]
        , div [ class "list" ] (List.map viewBounty (visibleBounties model))
        ]


{-| `select` elements report their value through the "change" event.
-}
onStatusInput : Html.Attribute Msg
onStatusInput =
    on "change" (Decode.map StatusChanged targetValue)


onSortInput : Html.Attribute Msg
onSortInput =
    on "change" (Decode.map SortChanged targetValue)


targetValue : Decode.Decoder String
targetValue =
    Decode.at [ "target", "value" ] Decode.string


viewBounty : Bounty -> Html Msg
viewBounty bounty =
    div [ class "bounty" ]
        [ strong [] [ text bounty.title ]
        , span [ class "org" ] [ text (" · " ++ bounty.org) ]
        , p [] [ text bounty.summary ]
        , div [ class "meta" ]
            [ span [] [ text ("$" ++ String.fromInt bounty.reward ++ " USDC") ]
            , span [] [ text (" · " ++ statusLabel bounty.status) ]
            , span [] [ text (" · due " ++ bounty.deadline) ]
            , span [] [ text (" · " ++ String.join ", " bounty.skills) ]
            ]
        ]


main : Program () Model Msg
main =
    Browser.sandbox
        { init = init
        , update = update
        , view = view
        }
