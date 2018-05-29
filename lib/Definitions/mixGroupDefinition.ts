import { modelReferenceArrayProperty } from "../Models/ModelProperties";
import ModelDefinition from "./ModelDefinition";
import ModelReference from "./ModelReference";
import primitiveProperty from "./primitiveProperty";

export default function mixGroupDefinition<TBase extends ModelDefinition.Constructor>(Base: TBase) {
    class GroupDefinition extends Base {
        @primitiveProperty({
            name: 'Is Open',
            description: 'True if this group is open and its contents are visible; otherwise, false.',
            type: 'boolean'
        })
        isOpen: boolean;

        @modelReferenceArrayProperty({
            name: 'Members',
            description: 'The members of this group.'
        })
        members: ModelReference[];
    }

    return GroupDefinition;
}
