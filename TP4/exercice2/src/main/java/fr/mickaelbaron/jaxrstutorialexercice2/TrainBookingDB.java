package fr.mickaelbaron.jaxrstutorialexercice2;

import java.util.ArrayList;
import java.util.List;

/**
 * Base de données en mémoire (statique) pour les trains et les réservations.
 */
public class TrainBookingDB {

    public static final List<Train> trains = new ArrayList<>();
    public static final List<TrainBooking> trainBookings = new ArrayList<>();

    static {
        trains.add(new Train("TR123", "Poitiers", "Paris",   "0800"));
        trains.add(new Train("TR456", "Paris",    "Poitiers","1200"));
        trains.add(new Train("TR789", "Poitiers", "Paris",   "1600"));
    }
}
