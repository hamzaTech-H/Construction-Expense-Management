import { Tabs } from "@/components/application/tabs/tabs";
import { NativeSelect } from "@/components/base/select/select-native";

interface ExpensesTabsProps {
  tabs: { id: string | number; label: string }[];
  selectedTabIndex: string | number;
  setSelectedTabIndex: React.Dispatch<React.SetStateAction<string | number>>;
}

 
export const ExpensesTabs = ({ tabs, selectedTabIndex, setSelectedTabIndex }: ExpensesTabsProps) => {
    
    return (
        <>
            <NativeSelect
                aria-label="Tabs"
                value={selectedTabIndex as string}
                onChange={(event) => setSelectedTabIndex(event.target.value)}
                options={tabs.map((tab) => ({ label: tab.label, value: String(tab.id), }))}
                className="w-80 md:hidden"
            />
            <Tabs selectedKey={selectedTabIndex} onSelectionChange={setSelectedTabIndex} className="w-max max-md:hidden">
                <Tabs.List type="underline" items={tabs}>
                    {(tab) => <Tabs.Item {...tab} />}
                </Tabs.List>
            </Tabs>
        </>
    );
};



