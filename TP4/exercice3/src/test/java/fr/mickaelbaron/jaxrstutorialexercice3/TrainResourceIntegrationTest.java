package fr.mickaelbaron.jaxrstutorialexercice3;

import fr.mickaelbaron.jaxrstutorialexercice2.TrainResource;
import jakarta.ws.rs.core.Application;
import jakarta.ws.rs.core.Response;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.test.JerseyTest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class TrainResourceIntegrationTest extends JerseyTest {

    @Override
    protected Application configure() {
        return new ResourceConfig(TrainResource.class);
    }

    // Given : 3 trains en base
    // When  : GET /trains
    // Then  : statut 200, liste de 3 trains
    @Test
    public void getTrainsTest() {
        Response response = target("/trains").request().get();

        assertEquals(200, response.getStatus());
        String body = response.readEntity(String.class);
        assertNotNull(body);
        assertTrue(body.contains("TR123"));
        assertTrue(body.contains("TR456"));
        assertTrue(body.contains("TR789"));
    }

    // Given : train TR123 avec departure "Poitiers"
    // When  : GET /trains/trainid-TR123
    // Then  : statut 200, departure = "Poitiers"
    @Test
    public void getTrainTest() {
        Response response = target("/trains/trainid-TR123").request().get();

        assertEquals(200, response.getStatus());
        String body = response.readEntity(String.class);
        assertTrue(body.contains("Poitiers"));
    }

    // Given : trains Poitiers→Paris à 0800 et 1600
    // When  : GET /trains/search?departure=Poitiers&arrival=Paris
    // Then  : statut 200, header x-result-count présent, 2 résultats
    @Test
    public void searchTrainsByCriteriaTest() {
        Response response = target("/trains/search")
                .queryParam("departure", "Poitiers")
                .queryParam("arrival", "Paris")
                .request()
                .get();

        assertEquals(200, response.getStatus());
        assertNotNull(response.getHeaderString("x-result-count"));
        assertEquals("2", response.getHeaderString("x-result-count"));
    }
}
