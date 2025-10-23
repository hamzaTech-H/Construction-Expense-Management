

import { Input } from "./components/base/input/input"
import { Button } from "./components/base/buttons/button"
import { Separator } from "react-aria-components"

export function SettingsPage() {


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and notification settings.
        </p>
      </header>

      <Separator />

      {/* --- Account Info --- */}

          <div className="grid gap-2">
            <Input aria-label="name" id="name"  />
          </div>

          <div className="grid gap-2">
            <Input id="email"  />
          </div>

          <Button className="mt-2 w-fit">Save Changes</Button>


      {/* --- Notifications --- */}

          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive updates and alerts via email.
            </p>
          </div>




    </div>
  )
}
