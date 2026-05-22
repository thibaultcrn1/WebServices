package fr.mickaelbaron.jaxrstutorialexercice3;

import fr.mickaelbaron.jaxrstutorialexercice2.TrainBooking;
import fr.mickaelbaron.jaxrstutorialexercice2.TrainBookingDB;
import fr.mickaelbaron.jaxrstutorialexercice2.TrainResource;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.Application;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.test.JerseyTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class TrainBookingResourceIntegrationTest extends JerseyTest {

    @Override
    protected Application configure() {
        return new ResourceConfig(TrainResource.class);
    }

    @BeforeEach
    public void resetDB() {
        TrainBookingDB.trainBookings.clear();
    }

    // Given : réservation valide (3 places, train TR123)
    // When  : POST /trains/bookings
    // Then  : statut 200, réservation créée avec un id
    @Test
    public void createTrainBookingTest() {
        TrainBooking booking = new TrainBooking(null, "TR123", 3);

        Response response = target("/trains/bookings")
                .request()
                .post(Entity.entity(booking, MediaType.APPLICATION_JSON));

        assertEquals(200, response.getStatus());
        TrainBooking created = response.readEntity(TrainBooking.class);
        assertNotNull(created.getId());
        assertEquals("TR123", created.getTrainId());
        assertEquals(3, created.getNumberPlaces());
    }

    // Given : id de train invalide
    // When  : POST /trains/bookings
    // Then  : statut 404
    @Test
    public void createTrainBookingWithBadTrainIdTest() {
        TrainBooking booking = new TrainBooking(null, "INVALID", 3);

        Response response = target("/trains/bookings")
                .request()
                .post(Entity.entity(booking, MediaType.APPLICATION_JSON));

        assertEquals(404, response.getStatus());
    }

    // Given : 1 réservation en base
    // When  : GET /trains/bookings
    // Then  : statut 200, liste de 1 élément
    @Test
    public void getTrainBookingsTest() {
        TrainBooking booking = new TrainBooking(null, "TR123", 2);
        Response post = target("/trains/bookings")
                .request()
                .post(Entity.entity(booking, MediaType.APPLICATION_JSON));
        String createdId = post.readEntity(TrainBooking.class).getId();

        Response response = target("/trains/bookings").request().get();
        assertEquals(200, response.getStatus());
        String body = response.readEntity(String.class);
        assertTrue(body.contains(createdId));
    }

    // Given : réservation existante
    // When  : GET /trains/bookings/{id}
    // Then  : statut 200
    @Test
    public void getTrainBookingTest() {
        TrainBooking booking = new TrainBooking(null, "TR456", 1);
        Response post = target("/trains/bookings")
                .request()
                .post(Entity.entity(booking, MediaType.APPLICATION_JSON));
        String createdId = post.readEntity(TrainBooking.class).getId();

        Response response = target("/trains/bookings/" + createdId).request().get();
        assertEquals(200, response.getStatus());
    }

    // Given : id de réservation invalide
    // When  : GET /trains/bookings/{id}
    // Then  : statut 404
    @Test
    public void getTrainBookingWithBadTrainBookingIdTest() {
        Response response = target("/trains/bookings/id-inexistant").request().get();
        assertEquals(404, response.getStatus());
    }

    // Given : réservation existante
    // When  : DELETE /trains/bookings/{id}
    // Then  : statut 204
    @Test
    public void removeTrainBookingTest() {
        TrainBooking booking = new TrainBooking(null, "TR789", 5);
        Response post = target("/trains/bookings")
                .request()
                .post(Entity.entity(booking, MediaType.APPLICATION_JSON));
        String createdId = post.readEntity(TrainBooking.class).getId();

        Response response = target("/trains/bookings/" + createdId).request().delete();
        assertEquals(204, response.getStatus());
    }

    // Given : id de réservation invalide
    // When  : DELETE /trains/bookings/{id}
    // Then  : statut 204 (idempotent)
    @Test
    public void removeTrainBookingWithBadTrainBookingIdTest() {
        Response response = target("/trains/bookings/id-inexistant").request().delete();
        assertEquals(204, response.getStatus());
    }
}
