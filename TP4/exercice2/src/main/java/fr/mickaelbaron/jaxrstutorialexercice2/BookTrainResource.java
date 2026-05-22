package fr.mickaelbaron.jaxrstutorialexercice2;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
@Consumes({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
public class BookTrainResource {

    // POST /trains/bookings → créer une réservation
    @POST
    public Response createTrainBooking(TrainBooking booking) {
        boolean trainExists = TrainBookingDB.trains.stream()
                .anyMatch(t -> t.getId().equals(booking.getTrainId()));

        if (!trainExists) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        booking.setId(UUID.randomUUID().toString());
        TrainBookingDB.trainBookings.add(booking);
        return Response.ok(booking).build();
    }

    // GET /trains/bookings → liste toutes les réservations
    @GET
    public List<TrainBooking> getTrainBookings() {
        return TrainBookingDB.trainBookings;
    }

    // GET /trains/bookings/{id}
    @GET
    @Path("/{id}")
    public Response getTrainBooking(@PathParam("id") String id) {
        return TrainBookingDB.trainBookings.stream()
                .filter(b -> b.getId().equals(id))
                .findFirst()
                .map(b -> Response.ok(b).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    // DELETE /trains/bookings/{id}
    @DELETE
    @Path("/{id}")
    public Response removeTrainBooking(@PathParam("id") String id) {
        TrainBookingDB.trainBookings.removeIf(b -> b.getId().equals(id));
        return Response.noContent().build();
    }
}
