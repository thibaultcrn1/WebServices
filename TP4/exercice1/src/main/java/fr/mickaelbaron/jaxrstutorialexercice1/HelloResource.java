package fr.mickaelbaron.jaxrstutorialexercice1;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

@Path("/hello")
public class HelloResource {

    // GET /hello → "Bonjour ENSMA"
    @GET
    public String getHello() {
        return "Bonjour ENSMA";
    }

    // GET /hello/{id} avec header "name" (défaut : "votre serviteur")
    @GET
    @Path("/{id}")
    public String getHelloWithId(
            @PathParam("id") String id,
            @HeaderParam("name") @DefaultValue("votre serviteur") String name) {
        return "Bonjour " + name + " depuis " + id;
    }

    // GET /hello/withheaders/{id} → renvoie le header "name" dans la réponse
    @GET
    @Path("/withheaders/{id}")
    public Response getHelloWithHeaders(
            @PathParam("id") String id,
            @HeaderParam("name") @DefaultValue("votre serviteur") String name) {
        return Response.ok("Bonjour " + name + " depuis " + id)
                .header("name", name)
                .build();
    }
}
