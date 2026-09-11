import Chat from "./pages/Chat.tsx";
import Room from "./pages/Room.tsx";
import St500 from "./pages/St500.tsx";
import CheckBackend from "./components/CheckBackend.tsx";
import { Routes, Route } from "react-router";
import PageNotFound from "./pages/PageNotFound.tsx";

const App = () => {
  return (
    <Routes>
      <Route element={<CheckBackend />}>
        <Route path="/" element={<Room />} />
        <Route path="/chat" element={<Chat />} />
      </Route>
      <Route path="/err500" element={<St500 />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default App;
