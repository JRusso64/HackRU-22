// TODO: Have multiple possible strings

const responses = {
    new_thanks: () => "Thank you for signing up!",
    new_explanation: () => "There are two ways to use this text journal. You can rant by typing RANT which allows you to continuously type. The second option is responding when you receieve a text",
    new_subscribe: () => "Do you want to subscribe (yes/no)?",
    new_notsubbed: () => "Okie doke! If you ever feel like coming just text again!",

    unsub_return: () => "Hello again! Do you want to subscribe now (yes/no)?",

    continue_history: () => "Would you like to view more past messages?",

    rant_choose: () => "Would you like to start a new rant or view an older one?",
    rant_going_to_history: (rantList) => `Ok, here's a look at your past rants: ${rantList.map((name, index) => {return `(${index+1}) ${name}`;}).join(", ")}. Which number do you want to look at?`,
    rant_startup: () => "I'm ready to write down a rant for you. What would you like to name it?",
    rant_ready: (rantName) => `I'll jot everything down under "${rantName}"! Now send messages to your heart's content, and when you're done send "finished".`,
    rant_finished:(rantName) => `That was good to get off your chest. I've now filed those messages under "${rantName}".`,
    
    rant_history_sending: (rantName) => `I'm now sending over "${rantName}".`,
    rant_history_empty: () => "This rant is empty!",

	tictactoe_moveorder: () => "Do you want to go first?",
	tictactoe_beginning: () => "Oo yay! Let's label the cells like this:\n1 | 2 | 3\n----------\n4 | 5 | 6\n----------\n7 | 8 | 9\nI'll be O, you be Xs",
	tictactoe_board: (board) => `${board[0]} | ${board[1]} | ${board[2]}\n----------\n${board[3]} | ${board[4]} | ${board[5]}\n----------\n${board[6]} | ${board[7]} | ${board[8]}`,
	tictactoe_userstart: () => "You start, so make your move!",
	tictactoe_usermove: () => "I went, it's your move now!",
	tictactoe_tie: () => "And it's a tie after all!",
	tictactoe_compwin: () => "Better luck next time!",
	tictactoe_userwin: () => "Well played!",

    unable_to_understand: () => "Sorry, I don't understand. Can you try again?",
    invalid_choice: () => "Sorry, that's an invalid choice. Can you try again?"

}

module.exports = responses;
