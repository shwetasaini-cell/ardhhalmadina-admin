import React from "react";
import "./Contacts.css";

export default function Contacts() {
  return (
    <div className="contacts-page row g-4 container">

      {/* LEFT PANEL */}
      <div className="col-lg-5">
        <div className="crm-panel">

          <div className="panel-header">
            <h6>Firmendaten</h6>
            <span className="arrow">⌄</span>
          </div>

          <div className="form-group">
            <label>Name</label>
            <input value="Pizza Funghi" />
          </div>

          <div className="row g-2">
            <div className="col">
              <label>PLZ</label>
              <input />
            </div>
            <div className="col">
              <label>Stadt</label>
              <input />
            </div>
            <div className="col-3">
              <label>Stadt</label>
              <div className="select-box">
                <input value="DE" />
                <span>▼</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Straße und Hausnr.</label>
            <input value="Lorem" />
          </div>

          <div className="form-group">
            <label>Niederlassung in</label>
            <input value="Lorem" />
          </div>

          <div className="form-group">
            <label>Anzahl Niederlassungen</label>
            <input value="Lorem" />
          </div>

          <div className="form-group">
            <label>Kategorie</label>
            <div className="select-box">
              <input value="Lorem" />
              <span>▼</span>
            </div>
          </div>

          <div className="form-group">
            <label>Firmengröße</label>
            <input value="Lorem" />
          </div>

          <div className="form-group">
            <label>Anzahl der Mitarbeiter</label>
            <input value="Lorem" />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input value="https://" />
          </div>

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-lg-7">
        <div className="crm-panel">

          {/* STATUS BAR */}
          <div className="status-row">
            <StatusSelect label="Status" />
            <StatusSelect label="Kontakt-Status" />
            <StatusSelect label="Kontakt-Status" />
          </div>

          {/* TABS */}
          <div className="tabs">
            <span className="tab active">Events</span>
            <span className="tab">Notes</span>
          </div>

          {/* TABLE */}
          <table className="events-table">
            <thead>
              <tr>
                <th>CREATED AT</th>
                <th>ACTION</th>
                <th>DESCR.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>13.12.2024 10:14</td>
                <td>Unsuccessful call</td>
                <td>--</td>
              </tr>
              <tr>
                <td>16.12.2024 09:12</td>
                <td>Successful call</td>
                <td>Contact person not in the house</td>
              </tr>
              <tr>
                <td>16.12.2024 09:12</td>
                <td>Successful call</td>
                <td>No interest</td>
              </tr>
              <tr>
                <td>21.01.2025 09:12</td>
                <td>Successful call</td>
                <td>No interest</td>
              </tr>
              <tr>
                <td>21.01.2025 09:12</td>
                <td>Unsuccessful call</td>
                <td>No interest</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}

/* STATUS COMPONENT */
function StatusSelect({ label }) {
  return (
    <div className="status-box">
      <label>{label}</label>
      <div className="select-box">
        <input value="Interessiert" readOnly />
        <span>▼</span>
      </div>
    </div>
  );
}
