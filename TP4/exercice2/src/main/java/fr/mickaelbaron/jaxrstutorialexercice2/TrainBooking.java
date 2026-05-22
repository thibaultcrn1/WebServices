package fr.mickaelbaron.jaxrstutorialexercice2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "trainbooking")
public class TrainBooking {

    private String id;

    @JsonProperty("current_train")
    private String trainId;

    @JsonProperty("number_places")
    private int numberPlaces;

    public TrainBooking() {}

    public TrainBooking(String id, String trainId, int numberPlaces) {
        this.id = id;
        this.trainId = trainId;
        this.numberPlaces = numberPlaces;
    }

    public String getId()                      { return id; }
    public void setId(String id)               { this.id = id; }

    public String getTrainId()                 { return trainId; }
    public void setTrainId(String trainId)     { this.trainId = trainId; }

    public int getNumberPlaces()               { return numberPlaces; }
    public void setNumberPlaces(int n)         { this.numberPlaces = n; }
}
