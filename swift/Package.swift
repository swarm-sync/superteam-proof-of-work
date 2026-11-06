// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "BountyBoard",
    platforms: [
        .macOS(.v14),
    ],
    products: [
        .library(name: "BountyBoard", targets: ["BountyBoard"]),
        .executable(name: "bounty-board", targets: ["BountyCLI"]),
    ],
    targets: [
        .target(
            name: "BountyBoard",
            path: "Sources/BountyBoard"
        ),
        .executableTarget(
            name: "BountyCLI",
            dependencies: ["BountyBoard"],
            path: "Sources/BountyCLI"
        ),
        .testTarget(
            name: "BountyBoardTests",
            dependencies: ["BountyBoard"],
            path: "Tests/BountyBoardTests",
            resources: [
                .copy("Fixtures"),
            ]
        ),
    ]
)
