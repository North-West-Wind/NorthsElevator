import { ChangeEvent, KeyboardEvent, MouseEvent } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";

export default function TogglableInput(props: { className?: string, value: string, onCommit: (value: string) => void, onClick?: () => void }) {
	const [value, setValue] = useState(props.value);
	const [edit, setEdit] = useState(false);
	const [size, setSize] = useState(value.length);
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setValue(props.value);
		setSize(props.value.length);
	}, [props.value]);

	const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
		setValue(ev.currentTarget.value);
		setSize(ev.currentTarget.value.length);
	};

	const onKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
		if (ev.key == "Enter" && edit) {
			ev.preventDefault();
			ev.stopPropagation();
			toggleEdit(false);
		}
	};

	const toggleEdit = (set?: boolean) => {
		if (set === undefined) {
			if (edit) props.onCommit(value);
			else ref.current?.focus();
			setEdit(!edit);
		} else {
			if (edit != set && !set) props.onCommit(value);
			setEdit(set);
		}
	};

	const onClickEdit = (ev: MouseEvent<HTMLDivElement>) => {
		ev.stopPropagation();
		toggleEdit();
	};

	const onClick = () => {
		if (props.onClick) props.onClick();
		else toggleEdit(true);
	};

	return <div className="togglable-input" onClick={() => !edit ? onClick() : ""} style={edit ? {} : { cursor: "pointer" }}>
		<div className="button" onClick={onClickEdit}>{edit ? "Save" : "Edit"}</div>
		<input
			value={value}
			disabled={!edit}
			className={(props.className || "") + (edit ? " edit" : "")}
			onChange={onChange} style={{ width: `${size * 1.25}vmax` }}
			onKeyDown={onKeyDown}
			onClick={() => !edit ? onClick() : ""}
			ref={ref}
		/>
	</div>;
}