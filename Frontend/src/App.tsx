import Chat from "./pages/Chat";
import Room from "./pages/Room";
import { Routes, Route } from "react-router";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Room />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
};

export default App;
