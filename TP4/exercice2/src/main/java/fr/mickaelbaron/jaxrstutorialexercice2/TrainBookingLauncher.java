package fr.mickaelbaron.jaxrstutorialexercice2;

import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;

import java.net.URI;
import java.util.logging.Level;
import java.util.logging.Logger;

public class TrainBookingLauncher {

    public static final String BASE_URI = "http://localhost:9992/api/";

    public static void main(String[] args) throws Exception {
        Logger.getLogger("org.glassfish").setLevel(Level.WARNING);

        ResourceConfig config = new ResourceConfig(TrainResource.class);

        HttpServer server = GrizzlyHttpServerFactory.createHttpServer(
                URI.create(BASE_URI), config);

        System.out.println("Serveur démarré sur " + BASE_URI);
        System.out.println("Trains    : " + BASE_URI + "trains");
        System.out.println("Réservations : " + BASE_URI + "trains/bookings");
        System.out.println("Appuyer sur Entrée pour arrêter...");
        System.in.read();
        server.stop();
    }
}
