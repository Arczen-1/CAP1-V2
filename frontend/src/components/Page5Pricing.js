import React from "react";

function Page5Pricing({ p1, pBuffet, p3, setP3, errors }) {
  const totalMenuCost = React.useMemo(() => {
    const price = parseFloat(p3.pricePerPlate) || 0;
    const guests = parseInt(p1.totalGuests) || 0;
    return price * guests;
  }, [p3.pricePerPlate, p1.totalGuests]);

  const totalFoodStations = React.useMemo(() => {
    return (pBuffet.foodStations || []).reduce((sum, station) => sum + (station.cost || 0), 0);
  }, [pBuffet.foodStations]);

  const subtotal = totalMenuCost + totalFoodStations;
  const vat = subtotal * 0.12;
  const serviceCharge = subtotal * 0.10;
  const grandTotal = subtotal + vat + serviceCharge;

  return (
    <div className="page">
      <h4>Pricing Summary</h4>
      <div className="pricing-section">
        <div className="form-row two">
          <div className="form-group">
            <label>Price per Plate</label>
            <input
              value={p3.pricePerPlate}
              onChange={(e) => setP3({ ...p3, pricePerPlate: e.target.value })}
              className={errors.pricePerPlate ? "invalid-input" : ""}
            />
            {errors.pricePerPlate && <div className="validation-error">{errors.pricePerPlate}</div>}
          </div>
          <div className="form-group">
            <label>Total Guests</label>
            <input value={p1.totalGuests} readOnly />
          </div>
        </div>
        <div className="form-row two">
          <div className="form-group">
            <label>Total Menu Cost</label>
            <input value={`₱${totalMenuCost.toFixed(2)}`} readOnly />
          </div>
          <div className="form-group">
            <label>Food Stations</label>
            <input value={`₱${totalFoodStations.toFixed(2)}`} readOnly />
          </div>
        </div>
        <div className="form-row three">
          <div className="form-group">
            <label>Subtotal</label>
            <input value={`₱${subtotal.toFixed(2)}`} readOnly />
          </div>
          <div className="form-group">
            <label>VAT (12%)</label>
            <input value={`₱${vat.toFixed(2)}`} readOnly />
          </div>
          <div className="form-group">
            <label>Service Charge (10%)</label>
            <input value={`₱${serviceCharge.toFixed(2)}`} readOnly />
          </div>
        </div>
        <div className="form-group">
          <label>Grand Total</label>
          <input value={`₱${grandTotal.toFixed(2)}`} readOnly />
        </div>
      </div>
      <h4>Menu Summary</h4>
      <div className="menu-summary">
        <p><strong>Cocktails:</strong> {(pBuffet.cocktailSelections || []).join(", ")}</p>
        <p><strong>Soup:</strong> {(pBuffet.soupSelections || []).join(", ")}</p>
        {/* Add more summaries */}
      </div>
    </div>
  );
}

export default Page5Pricing;
