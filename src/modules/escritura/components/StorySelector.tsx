import React from "react";

interface Story {
  id: string;
  title: string;
}

interface StorySelectorProps {
  selectedStoryId: string;
  storiesList: Story[];
  onChange: (id: string) => void;
}

export default function StorySelector({ selectedStoryId, storiesList, onChange }: StorySelectorProps) {
  return (
    <div className="topBar">
      <label className="topLabel">Historia:</label>
      <select className="topSelect" value={selectedStoryId} onChange={(e) => onChange(e.target.value)}>
        {storiesList.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
      </select>
    </div>
  );
}
