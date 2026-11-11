import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Menus() {
  const [menus, setMenus] = useState(null);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(0);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = () =>
    api
      .menus()
      .then(setMenus)
      .catch((e) => setMsg({ type: "error", text: e.message }));
  useEffect(() => {
    load();
  }, []);
  const run = async (fn, okText) => {
    try {
      await fn();
      setMsg(okText ? { type: "ok", text: okText } : null);
      await load();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api.createMenu({ title, sortOrder: Number(order) || 0 });
      setTitle("");
      setOrder(0);
    }, "Menu created");
  };
  const saveEdit = () =>
    run(async () => {
      await api.updateMenu(edit.id, {
        title: edit.title,
        sortOrder: Number(edit.sortOrder) || 0,
      });
      setEdit(null);
    }, "Menu updated");
  const remove = (m) => {
    if (window.confirm(`Delete the menu "${m.title}"?`))
      run(() => api.deleteMenu(m.id), "Menu deleted");
  };

  return (
    <>
      <div className="page-head">
        <h1>Menus</h1>
      </div>
      <p className="muted">
        Menus are the top-level items in the website navbar (for example{" "}
        <em>About Us</em> or <em>Services</em>). The title must match the navbar
        item on the website. Pages you add to a menu become its submenu.
      </p>
      {msg && (
        <div className={`alert ${msg.type}`} onClick={() => setMsg(null)}>
          {msg.text}
        </div>
      )}
      <div className="card">
        <form className="inline-form" onSubmit={add}>
          <input
            required
            maxLength={120}
            placeholder="New menu title (e.g. Services)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            className="narrow"
            title="Order"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <button className="btn-primary">Add menu</button>
        </form>
      </div>
      <div className="card">
        {!menus ? (
          <p className="muted">Loading…</p>
        ) : !menus.length ? (
          <p className="muted">No menus yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Order</th>
                <th>Pages</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) =>
                edit?.id === m.id ? (
                  <tr key={m.id}>
                    <td>
                      <input
                        value={edit.title}
                        onChange={(e) =>
                          setEdit({ ...edit, title: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="narrow"
                        value={edit.sortOrder}
                        onChange={(e) =>
                          setEdit({ ...edit, sortOrder: e.target.value })
                        }
                      />
                    </td>
                    <td>{m.pageCount}</td>
                    <td className="right actions">
                      <button className="btn-primary sm" onClick={saveEdit}>
                        Save
                      </button>
                      <button
                        className="btn-light sm"
                        onClick={() => setEdit(null)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.title}</strong>
                    </td>
                    <td>{m.sortOrder}</td>
                    <td>{m.pageCount}</td>
                    <td className="right actions">
                      <button
                        className="btn-light sm"
                        onClick={() =>
                          setEdit({
                            id: m.id,
                            title: m.title,
                            sortOrder: m.sortOrder,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger sm"
                        onClick={() => remove(m)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
