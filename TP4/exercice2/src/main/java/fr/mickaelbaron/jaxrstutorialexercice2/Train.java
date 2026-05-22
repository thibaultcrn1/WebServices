package fr.mickaelbaron.jaxrstutorialexercice2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "train")
public class Train {

    private String id;
    private String departure;
    private String arrival;

    @JsonProperty("departure_time")
    private String departureTime;

    public Train() {}

    public Train(String id, String departure, String arrival, String departureTime) {
        this.id = id;
        this.departure = departure;
        this.arrival = arrival;
        this.departureTime = departureTime;
    }

    public String getId()                      { return id; }
    public void setId(String id)               { this.id = id; }

    public String getDeparture()               { return departure; }
    public void setDeparture(String departure) { this.departure = departure; }

    public String getArrival()                 { return arrival; }
    public void setArrival(String arrival)     { this.arrival = arrival; }

    public String getDepartureTime()                       { return departureTime; }
    public void setDepartureTime(String departureTime)     { this.departureTime = departureTime; }
}
