package fr.mickaelbaron.jaxrstutorialexercice1;

import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;

import java.net.URI;

public class HelloLauncher {

    public static final String BASE_URI = "http://localhost:9991/api/";

    public static void main(String[] args) throws Exception {
        ResourceConfig config = new ResourceConfig(HelloResource.class);

        HttpServer server = GrizzlyHttpServerFactory.createHttpServer(
                URI.create(BASE_URI), config);

        System.out.println("Serveur démarré sur " + BASE_URI);
        System.out.println("WADL : " + BASE_URI + "application.wadl");
        System.out.println("Test : " + BASE_URI + "hello");
        System.out.println("Appuyer sur Entrée pour arrêter...");
        System.in.read();
        server.stop();
    }
}
