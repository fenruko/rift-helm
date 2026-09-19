import React from 'react';

// One panel shell for every chart: plain title, optional one-line note and
// one shared empty state so pages don't invent their own captions.
export default function ChartPanel({ title, note, aside, empty, children }) {
  return (
    <section className="dashboard-panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {note && <p className="panel-note">{note}</p>}
        </div>
        {aside}
      </div>
      {empty ? <div className="empty-table">{empty}</div> : children}
    </section>
  );
}
