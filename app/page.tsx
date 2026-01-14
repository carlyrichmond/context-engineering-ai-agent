"use client";

import { useChat } from "@ai-sdk/react";
import { FormEvent, KeyboardEvent, useState } from "react";
import Image from "next/image";
import { Converter } from "showdown";

import Spinner from "./components/spinner";
import { Weather, WeatherProps } from "./components/weather";

import pending from "../../public/multi-cloud.svg";
import { DefaultChatTransport } from "ai";
import pin from "../../public/world-pin.svg";
import { FCDOGuidance, FCDOGuidanceProps } from "./components/fcdo";
import { FlightProps, Flights } from "./components/flight";

export default function Chat() {
  const [input, setInput] = useState("");
  const [lastRequest, setLastRequest] = useState("");
  /* useChat hook helps us handle the input, resulting messages, and also handle the loading and error states for a better user experience */
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const markdownConverter = new Converter();

  function sendUserChat(
    event: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>
  ) {
    event.preventDefault();
    if (input.trim()) {
      sendMessage({
        parts: [{ type: "text", text: input }],
      });
      setLastRequest(input);
      setInput("");
    }
  }

  return (
    <div className="chat__form">
      <div className="chat__messages">
        {
          /* Display all user messages and assistant responses */
          messages.map((m) => (
            <div key={m.id} className="message">
              <div>
                {/* Messages with the role of *assistant* denote responses from the LLM */}
                <div className="role">
                  {m.role === "user" ? "Me" : "Sorley"}
                </div>
                {/* Tool handling */}
                <div className="tools__summary">
                  {m.parts.map((part, index) => {
                    if (part.type === "tool-weather") {
                      switch (part.state) {
                        case "input-available":
                          return (
                            <div className="weather__tool" key={index}>
                              <Image
                                src={pending}
                                width={80}
                                height={80}
                                alt="Placeholder Weather"
                              />
                              <p className="loading__weather__message">
                                Loading weather...
                              </p>
                            </div>
                          );
                        case "output-available":
                          return (
                            <div className="weather__tool" key={index}>
                              <Weather {...(part.output as WeatherProps)} />
                            </div>
                          );
                        case "output-error":
                          return (
                            <div className="weather__tool" key={index}>
                              No weather available!
                            </div>
                          );
                        default:
                          return null;
                      }
                    } else if (part.type === "tool-fcdo") {
                      switch (part.state) {
                        case "input-available":
                          return (
                            <div className="fcdo__tool" key={index}>
                              <Image
                                src={pin}
                                width={80}
                                height={80}
                                alt="Placeholder FCDO Advice"
                              />
                              <p className="loading__fcdo__message">
                                Loading FCDO advice...
                              </p>
                            </div>
                          );
                        case "output-available":
                          return (
                            <div className="fcdo__tool" key={index}>
                              <FCDOGuidance
                                {...(part.output as FCDOGuidanceProps)}
                              />
                            </div>
                          );
                        case "output-error":
                          return <div key={index}>No FCDO guidance!</div>;
                        default:
                          return null;
                      }
                    } else if (part.type === "tool-flights") {
                      switch (part.state) {
                        case "input-available":
                          return (
                            <div className="flights__tool" key={index}>
                              <Image
                                src={pin}
                                width={80}
                                height={80}
                                alt="Placeholder Flights"
                              />
                              <p className="loading__flights__message">
                                Loading flights...
                              </p>
                            </div>
                          );
                        case "output-available":
                          return (
                            <div className="flights__tool" key={index}>
                              <Flights {...(part.output as FlightProps)} />
                            </div>
                          );
                        case "output-error":
                          return <div key={index}>No flights available</div>;
                        default:
                          return null;
                      }
                    }
                  })}
                </div>
                {/* Standard text response */}
                {m.parts
                  .filter((part) => {
                    return part.type === "text";
                  })
                  .map((part, index) => {
                    {
                      /* User or LLM generated content */
                    }
                    return (
                      <div
                        className="itinerary__div"
                        key={`${m.id}-${index}-text`}
                        dangerouslySetInnerHTML={{
                          __html: markdownConverter.makeHtml(part.text),
                        }}
                      ></div>
                    );
                  })}
              </div>
            </div>
          ))
        }
      </div>
      {
        /* Spinner shows when awaiting a response */
        (status === "submitted" || status === "streaming") && (
          <div className="spinner__container">
            <Spinner />
            <button id="stop__button" type="button" onClick={() => stop()}>
              Stop
            </button>
          </div>
        )
      }
      {
        /* Show error message and return button when something goes wrong */
        error && (
          <>
            <div className="error__container">
              Unable to generate a plan. Please try again later!
            </div>
            <button
              id="retry__button"
              type="button"
              onClick={() => sendMessage({ text: lastRequest })}
            >
              Retry
            </button>
          </>
        )
      }
      <form
        onSubmit={(event) => {
          sendUserChat(event);
        }}
      >
        <input
          className="search-box__input"
          value={input}
          placeholder="Where would you like to go?"
          disabled={status !== "ready"}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          onKeyDown={async (event) => {
            if (event.key === "Enter") {
              sendUserChat(event);
            }
          }}
        />
      </form>
    </div>
  );
}