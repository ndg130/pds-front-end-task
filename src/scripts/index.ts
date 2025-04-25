// Import styles
import '../styles/main.scss';

interface MemberData {
  value: {
    id: number;
    nameListAs: string;
    nameDisplayAs: string;
    nameFullTitle: string;
    nameAddressAs: string | null;
    latestParty: {
      id: number;
      name: string;
      abbreviation: string;
      backgroundColour: string;
      foregroundColour: string;
      isLordsMainParty: boolean;
      isLordsSpiritualParty: boolean;
      governmentType: number;
      isIndependentParty: boolean;
    };
    gender: string;
    latestHouseMembership: {
      membershipFrom: string;
      membershipFromId: number;
      house: number;
      membershipStartDate: string;
      membershipEndDate: string | null;
      membershipEndReason: string | null;
      membershipEndReasonNotes: string | null;
      membershipEndReasonId: number | null;
      membershipStatus: {
        statusIsActive: boolean;
        statusDescription: string;
        statusNotes: string | null;
        statusId: number;
        status: number;
        statusStartDate: string;
      };
    };
    thumbnailUrl: string;
  };
  links: {
    rel: string;
    href: string;
    method: string;
  }[];
}

/** Our main application class, extend this as needed. */
class Main {
  private readonly verificationLog: string = 'Hello world!';

    constructor() {
        this.init();
    }

    private async init() {
        // Verify the application is running as intended by viewing this log in your
        // browser's development console. Feel free to delete this log once confirmed.
        console.log(this.verificationLog);

        try {
            this.displayUiInstructions(false);
            const id = this.readMemberId();
            const memberDetails = await this.fetchMemberDetails(id);
            console.log(memberDetails)
            this.renderMemberCard(memberDetails);
        } catch (error) {
            this.displayError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }

    /**
     * Reads the member ID from the URL query string.
     * Validates the ID and throws an error if invalid or missing.
     * @returns {number} The member ID as a number.
     * @throws {Error} Throws an error if the ID is missing, not a number, or not an integer.
     */
    private readMemberId(): number {
        // Parse the query string for the 'id' parameter
        const searchParams = new URLSearchParams(window.location.search);
        const memberId = searchParams.get('id');

        // Validate that the 'id' parameter exists
        if (!memberId) {
            throw new Error("Missing 'id' in the URL query string. Make sure to append ?id='ID' to the url.");
        }

        // Convert the 'id' to a number
        const idToNumber = Number(memberId);

        // Ensure the 'id' is a valid number
        if (isNaN(idToNumber)) {
            throw new Error("Id must be a valid number");
        }

        // Ensure the 'id' is an integer
        if (!Number.isInteger(idToNumber)) {
            throw new Error("Id must be an integer");
        }

        return idToNumber;
    }

    /**
     * Fetches member details from the API using the given member ID.
     * @param {number} id - The member ID to fetch details for.
     * @returns {Promise<MemberData>} A promise that resolves to the member data.
     * @throws {Error} Throws an error if the member is not found or response is not OK.
     */
    private async fetchMemberDetails(id: number): Promise<MemberData> {
        const url = `https://members-api.parliament.uk/api/Members/${id}`;

        // Send request to the API
        const response = await fetch(url);

        // Handle 404 Not Found error
        if (response.status === 404) {
            throw new Error('Member not found');
        } 
        // Handle other non-OK responses
        else if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        // Parse and return the JSON response
        return await response.json();
    }

    /**
     * Renders a member card in the UI with the provided member data.
     * @param {MemberData} data - The data containing member information.
     * @return {void}
     */
    private renderMemberCard(data: MemberData): void {
        const cardDisplay = document.querySelector('.card-display');

        // Return if card display is missing from DOM
        if (!cardDisplay) {
            console.error('Card display element not found');
            return;
        }

        // Construct the HTML layout for the member card
        const cardLayout = `
        <div class="card-member">
            <div class="card-inner">
                <div class="content-image">
                    <img 
                    src="${data.value.thumbnailUrl}" 
                    alt=""
                    style="border-color: #${data.value.latestParty.backgroundColour};"
                    >
                </div>
                <div class="content-info">
                    <p class="info-secondary">${data.value.latestParty.name}</p>
                    <p class="info-primary">${data.value.nameDisplayAs}</p>
                    <p class="info-tertiary">${data.value.latestHouseMembership.membershipFrom}</p>
                </div>
            </div>
        </div>
        `;

        // Insert the member card into the DOM
        cardDisplay.insertAdjacentHTML('beforeend', cardLayout);

        // Check if member is still serving
        const isMemberStillServing = this.checkMembershipEndDate(data.value.latestHouseMembership.membershipEndDate); 
        
        // Display the 'No longer serving' message on the card if the member is not serving
        if (!isMemberStillServing) {
            this.displayNoLongerServing();
        }

        // Hide ui instructions
        this.displayUiInstructions(false);
    }

    /**
     * Checks if the member is still serving in parliament
     * Based on the `membershipEndDate` returned from the API
     * @param {string | null} date - The date from the API
     * @return {boolean} True if the member is still serving, false otherwise
     */
    private checkMembershipEndDate(date: string | null): boolean {
        
        // check if response is null
        // it appears that the API returns null if the member is still serving
        // it likely won't change to a date in the future, but need to add check just in case
        if (date === null) {
        return true;
        }

        const today = new Date();
        const endDate = new Date(date);

        // check if the member is still serving
        // if today is after the endDate, then the member is no longer serving
        // otherwise, the member is still serving
        return today <= endDate;
    }
  

    /**
     * Insert a 'No longer serving' message into the UI
     * When the data from the API indicates that the member is no longer serving
     * This message is added to the card UI
     * @return {void}
     */
    private displayNoLongerServing(): void {

        const noLongerServing = `
            <div class="info-additional">
                <p>No longer serving</p>
            </div>
        `;

        const contentInfo = document.querySelector('.card-member:last-child .content-info');

        // insert no longer serving message to card UI
        if (contentInfo) {
            contentInfo.insertAdjacentHTML('beforeend', noLongerServing);
        } 
    }


    /**
     * Hides the error display by adding the 'hidden' class and clearing its text content.
     * @param {Element} element - The element to hide.
     */
    private hideErrorDisplay = (element: Element) => {
        if (element) {
            element.classList.add('hidden');
            element.textContent = "";
        }
    };

    /**
     * Hides or shows the 'Get started' message in the UI
     * @param {boolean} value - True to show the message, false to hide it
     * @return {void}
     */
    private displayUiInstructions(value: boolean): void {

        const errorDisplay = document.querySelector('.error-message');
        const getStartedDisplay = document.querySelector('.get-started');

        if (!value) {
            getStartedDisplay?.classList.add('hidden');
            this.hideErrorDisplay(errorDisplay);
        } else {
            getStartedDisplay?.classList.remove('hidden');
            this.hideErrorDisplay(errorDisplay);
        }
    }

    /**
     * Displays an error message to the user in the UI
     * @param {string} message - The error message to display
     * @return {void}
     */
    private displayError(message: string): void {
        // Get references to the elements that need to be updated
        const errorDisplay = document.querySelector('.error-message');
        const getStartedDisplay = document.querySelector('.get-started');

        // If the error display element exists
        if (errorDisplay) {
            // Update the error display with the message
            errorDisplay.textContent = message;
            // Remove the hidden class so the error message is displayed
            errorDisplay.classList.remove('hidden');
            // Hide the get started message
            getStartedDisplay.classList.add('hidden');
        } else {
            // If the error display element does not exist, use an alert box as a fallback
            alert(message);
        }
    }
}

new Main();