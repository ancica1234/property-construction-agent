from typing import Optional
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing import Annotated, TypedDict, List

from services.agent.tools import ALL_TOOLS
from core.config import settings


class AgentState(TypedDict):
    messages: Annotated[List, add_messages]
    property_context: str


def manager_node(state: AgentState) -> dict:
    prompt = f"""You are an expert construction project manager for San Diego property investments.

Property context:
{state.get('property_context', 'No specific property selected.')}

User message: {state['messages'][-1].content}

Use available tools to give specific, actionable advice about budget, ROI, risks, checklists, and timelines."""

    llm = ChatOpenAI(model="gpt-4o", api_key=settings.OPENAI_API_KEY).bind_tools(ALL_TOOLS)
    response = llm.invoke(prompt)
    return {"messages": [response]}


def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("manager", manager_node)
    workflow.add_edge(START, "manager")
    workflow.add_edge("manager", END)
    return workflow.compile()


_app = build_graph()


def build_agent_state(message: str, property=None) -> dict:
    context = "No specific property selected."
    if property:
        spent = property.spent_so_far or 0
        total = property.total_budget or 0
        context = (
            f"Property: {property.name} at {property.address}, {property.zip_code}\n"
            f"Status: {property.status}\n"
            f"Budget: ${total:,.0f} total | ${spent:,.0f} spent | ${total - spent:,.0f} remaining\n"
            f"Timeline: {property.start_date} to {property.target_end_date}\n"
            f"Units: {property.units_config}\n"
            f"Projected rents: {property.projected_rents}"
        )
    return {
        "messages": [HumanMessage(content=message)],
        "property_context": context,
    }


def run_agent(state: dict) -> str:
    result = _app.invoke(state)
    last = result["messages"][-1]
    return last.content if hasattr(last, "content") else str(last)
