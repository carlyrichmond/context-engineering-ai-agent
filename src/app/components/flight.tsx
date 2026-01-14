import { Flight } from '../model/flight.model';

export type FlightProps = {
  outbound: Flight, 
  inbound: Flight
}

export type RecommendedFlights = {
  outbound: Flight,
  inbound: Flight
}

function priceWithCommas(price: number): string {
  if (!price) { 
    return "-";
  }
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const Flights = (props: FlightProps) => {
  return (
    <div className="flights__summary__div">
      <p className="flights__emoji">✈️</p>
        <div className="flights__section">
          <h4>Outbound Flights</h4>
          { !props.outbound && <p>No return flights available</p> }
            <div className="flights__detail">
              <p>{props.outbound?.flight_number} on {new Date(props.outbound?.departure_date).toLocaleDateString()}: £{priceWithCommas(props.outbound?.price)}</p>
            </div>
          <h4>Inbound Flights</h4>
          { !props.inbound && <p>No return flights available</p> }
            <div className="flights__detail">
              <p>{props.outbound?.flight_number} on {new Date(props.inbound?.departure_date).toLocaleDateString()}: £{priceWithCommas(props.inbound?.price)}</p>
            </div>
        </div>
    </div>
  );
};
