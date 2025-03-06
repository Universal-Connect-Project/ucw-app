import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const domNode = document.getElementById("root");
const root = ReactDOM.createRoot(domNode as HTMLElement);

root.render(<App />);
