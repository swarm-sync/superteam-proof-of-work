package com.benstone.listings;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.time.Clock;
import java.util.concurrent.Executors;
import java.util.logging.Logger;

/**
 * Entry point. Starts the listings service on {@code PORT} (default 8080).
 * Graceful shutdown on SIGINT/SIGTERM: the server stops accepting and the
 * executor is shut down instead of the process being killed mid-request.
 */
public class ListingsApplication {

    private static final Logger LOG = Logger.getLogger(ListingsApplication.class.getName());

    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = createServer(port);
        server.start();
        LOG.info("listings-service listening on port " + server.getAddress().getPort());

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("shutting down listings-service");
            server.stop(1);
            if (server.getExecutor() instanceof java.util.concurrent.ExecutorService es) {
                es.shutdown();
            }
        }));
    }

    /** Builds the server without starting it, so tests can bind an ephemeral port. */
    public static HttpServer createServer(int port) throws Exception {
        ListingService service = new ListingService(
                new InMemoryListingRepository(), Clock.systemUTC());
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", new ListingHttpHandler(service));
        server.setExecutor(Executors.newFixedThreadPool(4));
        return server;
    }
}
