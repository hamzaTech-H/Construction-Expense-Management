import './App.css';
import { Button } from '@/components/base/buttons/button';

const App: React.FC = () => {
  const handleAddUser = async () => {
    const result = await window.database.addUser('John Doe', 'john.do@example.com');
    console.log('User added with ID:', result);
  };

  const handleGetUser = async () => {
    const user = await window.database.getUser(1);
    if (user) {
      console.log('Fetched user:', user);
    } else {
      console.log('User not found');
    }
  };

  return (
    <div>
      <h1>Electron with better-sqlite3</h1>
      <Button onClick={handleAddUser}>Add User</Button>
      <Button onClick={handleGetUser}>Get User</Button>
    </div>
  );
};

export default App;
