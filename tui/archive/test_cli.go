package main

import (
	"encoding/json"
	"fmt"
	"os/exec"
)

type Investigation struct {
	ID                int    `json:"id"`
	CustomerName      string `json:"customer_name"`
	Classification    string `json:"classification"`
	Status            string `json:"status"`
}

func getStatusIcon(status string) string {
	switch status {
	case "running":
		return "🟡"
	case "waiting":
		return "🔵"
	case "completed", "complete":
		return "🟢"
	case "error":
		return "🔴"
	default:
		return "○"
	}
}

func main() {
	fmt.Println("Testing CLI integration...")
	fmt.Println()

	// Test 1: Call triage list --json
	fmt.Println("Test 1: Calling 'triage list --json'")
	cmd := exec.Command("/Users/jacobaguon/support-triage/bin/triage", "list", "--json")

	output, err := cmd.Output()
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	var investigations []Investigation
	err = json.Unmarshal(output, &investigations)
	if err != nil {
		fmt.Printf("❌ JSON parse error: %v\n", err)
		return
	}

	fmt.Printf("✅ Success! Found %d investigations\n", len(investigations))
	fmt.Println()

	// Show first 5
	fmt.Println("First 5 investigations:")
	for i, inv := range investigations {
		if i >= 5 {
			break
		}
		statusIcon := getStatusIcon(inv.Status)
		fmt.Printf("  %s #%d - %s (%s, %s)\n",
			statusIcon, inv.ID, inv.CustomerName, inv.Status, inv.Classification)
	}

	fmt.Println()
	fmt.Println("✅ CLI integration working!")
	fmt.Println()
	fmt.Println("To run the full TUI in your terminal:")
	fmt.Println("  cd ~/support-triage/tui")
	fmt.Println("  ./triage-tui")
}
