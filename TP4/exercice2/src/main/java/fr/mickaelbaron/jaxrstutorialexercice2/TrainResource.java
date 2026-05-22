package fr.mickaelbaron.jaxrstutorialexercice2;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.stream.Collectors;

@Path("/trains")
@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
public class TrainResource {

    // GET /trains → liste complète
    @GET
    public List<Train> getTrains() {
        return TrainBookingDB.trains;
    }

    // GET /trains/trainid-{id}
    @GET
    @Path("/trainid-{id}")
    public Response getTrain(@PathParam("id") String id) {
        return TrainBookingDB.trains.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .map(t -> Response.ok(t).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    // GET /trains/search?departure=&arrival=&departure_time=
    @GET
    @Path("/search")
    public Response searchTrainsByCriteria(
            @QueryParam("departure")      String departure,
            @QueryParam("arrival")        String arrival,
            @QueryParam("departure_time") String departureTime) {

        List<Train> result = TrainBookingDB.trains.stream()
                .filter(t -> departure     == null || t.getDeparture().equalsIgnoreCase(departure))
                .filter(t -> arrival       == null || t.getArrival().equalsIgnoreCase(arrival))
                .filter(t -> departureTime == null || t.getDepartureTime().equals(departureTime))
                .collect(Collectors.toList());

        return Response.ok(result)
                .header("x-result-count", result.size())
                .build();
    }

    // Sub-resource locator → /trains/bookings
    @Path("/bookings")
    public BookTrainResource getTrainBookingResource() {
        return new BookTrainResource();
    }
}
